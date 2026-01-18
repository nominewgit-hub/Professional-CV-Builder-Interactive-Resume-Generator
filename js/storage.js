// ============================================
// UPDATED STORAGE MANAGER
// ============================================

class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'cvBuilderData';
        this.MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB
        this.AUTO_SAVE_INTERVAL = 10000; // 10 seconds
        this.autoSaveTimer = null;
        this.listeners = new Set();
    }

    // ============================================
    // DATA OPERATIONS
    // ============================================

    save(data) {
        try {
            // Don't save empty data
            if (!data || Object.keys(data).length === 0) {
                return false;
            }

            // Add metadata
            const storageData = {
                data: this.compressData(data),
                timestamp: new Date().toISOString(),
                version: '2.0.0'
            };

            // Check storage size
            const dataSize = this.getDataSize(storageData);
            if (dataSize > this.MAX_STORAGE_SIZE) {
                console.warn('Data size exceeds limit, performing cleanup');
                this.cleanupOldData(7); // Clean data older than 7 days
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
            this.dispatchEvent('save', storageData);
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            this.dispatchEvent('error', { error: error.message });
            return false;
        }
    }

    load() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (!stored) return null;

            const parsed = JSON.parse(stored);
            
            // Check version compatibility
            if (parsed.version !== '2.0.0') {
                console.warn('Version mismatch, migrating data...');
                return this.migrateData(parsed.data, parsed.version);
            }

            const data = this.decompressData(parsed.data);
            this.dispatchEvent('load', { data, timestamp: parsed.timestamp });
            return data;
        } catch (error) {
            console.error('Error loading data:', error);
            this.dispatchEvent('error', { error: error.message });
            return null;
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            this.dispatchEvent('clear');
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    // ============================================
    // AUTO-SAVE FEATURE
    // ============================================

    startAutoSave(callback, interval = this.AUTO_SAVE_INTERVAL) {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
        }

        this.autoSaveTimer = setInterval(() => {
            try {
                const data = callback();
                if (data && this.hasChanges(data)) {
                    this.save(data);
                    this.dispatchEvent('autoSave', { 
                        timestamp: new Date().toISOString(),
                        dataSize: this.getDataSize(data)
                    });
                }
            } catch (error) {
                console.error('Auto-save error:', error);
            }
        }, interval);
    }

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // ============================================
    // DATA COMPRESSION
    // ============================================

    compressData(data) {
        // Simple compression by removing whitespace and empty values
        const compressed = JSON.stringify(data, (key, value) => {
            if (value === null || value === undefined || value === '') {
                return undefined;
            }
            return value;
        });
        
        return {
            compressed: true,
            data: compressed
        };
    }

    decompressData(compressedData) {
        if (!compressedData || !compressedData.compressed) {
            return compressedData || {};
        }

        try {
            return JSON.parse(compressedData.data);
        } catch (error) {
            console.error('Error decompressing data:', error);
            return {};
        }
    }

    // ============================================
    // DATA MIGRATION
    // ============================================

    migrateData(data, oldVersion) {
        // Migration from v1.0.0 to v2.0.0
        if (oldVersion === '1.0.0') {
            const migrated = { ...data };
            
            // Normalize education and experience to arrays
            if (migrated.education && typeof migrated.education === 'object') {
                migrated.education = Object.values(migrated.education).filter(item => item.degree);
            }
            
            if (migrated.experience && typeof migrated.experience === 'object') {
                migrated.experience = Object.values(migrated.experience).filter(item => item.title);
            }
            
            // Normalize skills to array
            if (typeof migrated.skills === 'string') {
                migrated.skills = migrated.skills.split(',').map(s => s.trim()).filter(s => s);
            }
            
            return migrated;
        }
        
        return data || {};
    }

    // ============================================
    // UTILITIES
    // ============================================

    getDataSize(data) {
        try {
            return new Blob([JSON.stringify(data)]).size;
        } catch {
            return 0;
        }
    }

    getAvailableSpace() {
        try {
            let used = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                used += (key.length + value.length) * 2; // UTF-16
            }
            return this.MAX_STORAGE_SIZE - used;
        } catch {
            return this.MAX_STORAGE_SIZE;
        }
    }

    hasChanges(newData) {
        const oldData = this.load();
        if (!oldData) return true;
        
        // Compare only the data part, ignore metadata
        const oldDataString = JSON.stringify(oldData);
        const newDataString = JSON.stringify(newData);
        
        return oldDataString !== newDataString;
    }

    // ============================================
    // EVENT SYSTEM
    // ============================================

    addEventListener(event, callback) {
        this.listeners.add({ event, callback });
    }

    removeEventListener(event, callback) {
        for (const listener of this.listeners) {
            if (listener.event === event && listener.callback === callback) {
                this.listeners.delete(listener);
                break;
            }
        }
    }

    dispatchEvent(event, detail = {}) {
        for (const listener of this.listeners) {
            if (listener.event === event) {
                try {
                    listener.callback(detail);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            }
        }
        
        // Also dispatch CustomEvent for DOM
        const customEvent = new CustomEvent(`storage:${event}`, { detail });
        document.dispatchEvent(customEvent);
    }

    // ============================================
    // BACKUP & RESTORE
    // ============================================

    createBackup() {
        const data = this.load();
        if (!data) return null;

        const backup = {
            data: data,
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            type: 'backup'
        };

        const blob = new Blob([JSON.stringify(backup, null, 2)], { 
            type: 'application/json' 
        });
        return URL.createObjectURL(blob);
    }

    restoreBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    // Validate backup
                    if (!backup.data || !backup.timestamp || backup.version !== '2.0.0') {
                        throw new Error('Invalid or incompatible backup file');
                    }

                    this.save(backup.data);
                    resolve(backup.data);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read backup file'));
            reader.readAsText(file);
        });
    }

    // ============================================
    // EXPORT/IMPORT
    // ============================================

    exportData(format = 'json') {
        const data = this.load();
        if (!data) {
            throw new Error('No data to export');
        }

        const exportData = {
            ...data,
            exportDate: new Date().toISOString(),
            version: '2.0.0',
            source: 'CV Builder'
        };

        let blob, filename;

        switch (format.toLowerCase()) {
            case 'json':
                blob = new Blob([JSON.stringify(exportData, null, 2)], { 
                    type: 'application/json' 
                });
                filename = `cv-data-${new Date().toISOString().split('T')[0]}.json`;
                break;

            case 'txt':
                const text = this.exportAsText(exportData);
                blob = new Blob([text], { type: 'text/plain' });
                filename = `cv-${new Date().toISOString().split('T')[0]}.txt`;
                break;

            default:
                throw new Error(`Unsupported format: ${format}`);
        }

        return { blob, filename, url: URL.createObjectURL(blob) };
    }

    exportAsText(data) {
        let text = '';
        
        // Header
        text += '='.repeat(50) + '\n';
        text += `CV EXPORT - ${new Date().toLocaleDateString()}\n`;
        text += '='.repeat(50) + '\n\n';
        
        // Personal Info
        if (data.fullName || data.email || data.phone) {
            text += 'PERSONAL INFORMATION\n';
            text += '-'.repeat(50) + '\n';
            if (data.fullName) text += `Name: ${data.fullName}\n`;
            if (data.email) text += `Email: ${data.email}\n`;
            if (data.phone) text += `Phone: ${data.phone}\n`;
            if (data.address) text += `Address: ${data.address}\n`;
            text += '\n';
        }
        
        // Education
        if (data.education && Object.keys(data.education).length > 0) {
            text += 'EDUCATION\n';
            text += '-'.repeat(50) + '\n';
            Object.values(data.education).forEach((edu, index) => {
                text += `${index + 1}. ${edu.degree || ''}\n`;
                text += `   ${edu.institution || ''}\n`;
                text += `   ${edu.year || ''}${edu.grade ? ` - ${edu.grade}` : ''}\n\n`;
            });
        }
        
        // Experience
        if (data.experience && Object.keys(data.experience).length > 0) {
            text += 'EXPERIENCE\n';
            text += '-'.repeat(50) + '\n';
            Object.values(data.experience).forEach((exp, index) => {
                text += `${index + 1}. ${exp.title || ''}\n`;
                text += `   ${exp.company || ''}\n`;
                text += `   ${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}\n`;
                if (exp.description) {
                    text += `   ${exp.description.replace(/\n/g, '\n   ')}\n`;
                }
                text += '\n';
            });
        }
        
        // Skills
        if (data.skills && data.skills.length > 0) {
            text += 'SKILLS\n';
            text += '-'.repeat(50) + '\n';
            data.skills.forEach((skill, index) => {
                text += `• ${skill}\n`;
            });
            text += '\n';
        }
        
        return text;
    }

    importData(file, format = 'json') {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    let data;
                    
                    switch (format.toLowerCase()) {
                        case 'json':
                            data = JSON.parse(e.target.result);
                            break;
                        case 'txt':
                            data = this.parseText(e.target.result);
                            break;
                        default:
                            throw new Error(`Unsupported format: ${format}`);
                    }

                    // Validate and normalize data
                    const normalizedData = this.normalizeImportedData(data);
                    
                    // Save imported data
                    this.save(normalizedData);
                    resolve(normalizedData);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    parseText(text) {
        // Simple text parser for CV data
        const sections = text.split(/\n-{50}\n/);
        const data = {};
        
        sections.forEach(section => {
            const lines = section.split('\n');
            const sectionTitle = lines[0].trim();
            
            switch(sectionTitle) {
                case 'PERSONAL INFORMATION':
                    lines.slice(1).forEach(line => {
                        if (line.includes('Name:')) data.fullName = line.replace('Name:', '').trim();
                        if (line.includes('Email:')) data.email = line.replace('Email:', '').trim();
                        if (line.includes('Phone:')) data.phone = line.replace('Phone:', '').trim();
                        if (line.includes('Address:')) data.address = line.replace('Address:', '').trim();
                    });
                    break;
                    
                case 'EDUCATION':
                    // Simplified parsing - in real app would be more complex
                    data.education = {};
                    break;
            }
        });
        
        return data;
    }

    normalizeImportedData(data) {
        const normalized = { ...data };
        
        // Ensure skills is an array
        if (normalized.skills && typeof normalized.skills === 'string') {
            normalized.skills = normalized.skills.split(',').map(s => s.trim()).filter(s => s);
        }
        
        // Ensure education and experience are objects if they exist
        if (normalized.education && Array.isArray(normalized.education)) {
            const educationObj = {};
            normalized.education.forEach((item, index) => {
                if (item.degree) {
                    educationObj[index + 1] = item;
                }
            });
            normalized.education = educationObj;
        }
        
        if (normalized.experience && Array.isArray(normalized.experience)) {
            const experienceObj = {};
            normalized.experience.forEach((item, index) => {
                if (item.title) {
                    experienceObj[index + 1] = item;
                }
            });
            normalized.experience = experienceObj;
        }
        
        return normalized;
    }

    // ============================================
    // STORAGE STATISTICS
    // ============================================

    getStatistics() {
        try {
            const data = this.load();
            const storageStats = this.getStorageStats();
            
            return {
                dataSize: this.getDataSize(data),
                lastSaved: data?.timestamp || 'Never',
                itemsCount: data ? Object.keys(data).length : 0,
                ...storageStats
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return null;
        }
    }

    getStorageStats() {
        try {
            let totalSize = 0;
            let itemCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                totalSize += (key.length + value.length) * 2;
                itemCount++;
            }

            return {
                totalStorageSize: totalSize,
                storageItemCount: itemCount,
                availableStorage: this.MAX_STORAGE_SIZE - totalSize,
                storageUsage: ((totalSize / this.MAX_STORAGE_SIZE) * 100).toFixed(1)
            };
        } catch {
            return {
                totalStorageSize: 0,
                storageItemCount: 0,
                availableStorage: this.MAX_STORAGE_SIZE,
                storageUsage: '0.0'
            };
        }
    }

    // ============================================
    // CLEANUP UTILITIES
    // ============================================

    cleanupOldData(maxAgeDays = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
            
            let cleanedCount = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                // Skip main data
                if (key === this.STORAGE_KEY) continue;
                
                try {
                    const item = localStorage.getItem(key);
                    const parsed = JSON.parse(item);
                    
                    if (parsed && parsed.timestamp) {
                        const itemDate = new Date(parsed.timestamp);
                        if (itemDate < cutoffDate) {
                            localStorage.removeItem(key);
                            cleanedCount++;
                        }
                    }
                } catch {
                    // If can't parse, remove if it's old based on key pattern
                    if (key.includes('old_') || key.includes('temp_')) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                }
            }
            
            if (cleanedCount > 0) {
                this.dispatchEvent('cleanup', { cleanedCount });
            }
            
            return cleanedCount;
        } catch (error) {
            console.error('Error cleaning up old data:', error);
            return 0;
        }
    }

    // ============================================
    // DATA VALIDATION
    // ============================================

    validateData(data) {
        const errors = [];
        
        if (!data || typeof data !== 'object') {
            errors.push('Data must be an object');
            return { isValid: false, errors };
        }
        
        // Check for required fields in personal info
        if (!data.fullName || data.fullName.trim().length < 2) {
            errors.push('Full name is required and must be at least 2 characters');
        }
        
        if (data.email && !this.isValidEmail(data.email)) {
            errors.push('Invalid email format');
        }
        
        if (data.phone && !this.isValidPhone(data.phone)) {
            errors.push('Invalid phone number');
        }
        
        // Check skills
        if (!data.skills || !Array.isArray(data.skills) || data.skills.length === 0) {
            errors.push('At least one skill is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{8,}$/;
        const cleanedPhone = phone.replace(/[\s\-\(\)]/g, '');
        return phoneRegex.test(cleanedPhone);
    }
}

// ============================================
// EXPORT STORAGE MANAGER
// ============================================

// Create global instance
window.storageManager = new StorageManager();

// Initialize storage management
document.addEventListener('DOMContentLoaded', () => {
    // Cleanup old data on startup
    setTimeout(() => {
        const cleaned = window.storageManager.cleanupOldData(30);
        if (cleaned > 0) {
            console.log(`Storage cleanup: Removed ${cleaned} old items`);
        }
    }, 3000);
    
    // Monitor storage events
    window.addEventListener('storage', (e) => {
        if (e.key === window.storageManager.STORAGE_KEY) {
            window.storageManager.dispatchEvent('externalChange', {
                oldValue: e.oldValue,
                newValue: e.newValue
            });
        }
    });
});