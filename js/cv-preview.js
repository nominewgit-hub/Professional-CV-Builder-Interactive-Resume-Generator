// ============================================
// PROFESSIONAL CV PREVIEW GENERATOR
// ============================================

class CVPreviewGenerator {
    constructor() {
        this.templates = {
            modern: this.generateModernTemplate,
            classic: this.generateClassicTemplate,
            creative: this.generateCreativeTemplate
        };
        
        this.currentTemplate = 'modern';
        this.cvData = null;
    }

    // ============================================
    // TEMPLATE GENERATORS
    // ============================================

    generateModernTemplate(data) {
        return `
            <div class="cv-template modern">
                <!-- Header Section -->
                <header class="cv-header">
                    <div class="header-content">
                        <!-- Left: Personal Info -->
                        <div class="header-info">
                            <h1 class="cv-name">${data.fullName || 'Your Name'}</h1>
                            <h2 class="cv-title">${data.address ? data.address.split(',')[0] : 'Professional'}</h2>
                            
                            <div class="contact-info">
                                ${data.email ? `
                                    <div class="contact-item">
                                        <i class="fas fa-envelope"></i>
                                        <span>${data.email}</span>
                                    </div>
                                ` : ''}
                                
                                ${data.phone ? `
                                    <div class="contact-item">
                                        <i class="fas fa-phone"></i>
                                        <span>${data.phone}</span>
                                    </div>
                                ` : ''}
                                
                                ${data.address ? `
                                    <div class="contact-item">
                                        <i class="fas fa-map-marker-alt"></i>
                                        <span>${data.address}</span>
                                    </div>
                                ` : ''}
                                
                                ${data.linkedin ? `
                                    <div class="contact-item">
                                        <i class="fab fa-linkedin"></i>
                                        <a href="${data.linkedin}" target="_blank">LinkedIn Profile</a>
                                    </div>
                                ` : ''}
                                
                                ${data.portfolio ? `
                                    <div class="contact-item">
                                        <i class="fas fa-globe"></i>
                                        <a href="${data.portfolio}" target="_blank">Portfolio</a>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        <!-- Right: Profile Picture -->
                        ${data.profilePic ? `
                            <div class="profile-image">
                                <img src="${data.profilePic}" alt="${data.fullName || 'Profile Picture'}" 
                                     onerror="this.style.display='none'">
                            </div>
                        ` : ''}
                    </div>
                </header>

                <!-- Main Content -->
                <main class="cv-content">
                    ${this.generateSummarySection(data)}
                    ${this.generateExperienceSection(data)}
                    ${this.generateEducationSection(data)}
                    ${this.generateSkillsSection(data)}
                </main>
            </div>
        `;
    }

    generateClassicTemplate(data) {
        return `
            <div class="cv-template classic">
                <div class="cv-container">
                    <!-- Classic Header -->
                    <div class="classic-header">
                        <h1>${data.fullName || 'Your Name'}</h1>
                        <div class="classic-subtitle">
                            ${data.email || 'professional@example.com'} ${data.phone ? `| ${data.phone}` : ''}
                        </div>
                    </div>
                    
                    <!-- Two Column Layout -->
                    <div class="classic-columns">
                        <div class="left-column">
                            ${data.profilePic ? `
                                <div class="classic-photo">
                                    <img src="${data.profilePic}" alt="Profile">
                                </div>
                            ` : ''}
                            
                            ${this.generateSkillsSection(data, true)}
                            
                            ${data.linkedin || data.portfolio ? `
                                <div class="classic-links">
                                    ${data.linkedin ? `
                                        <div><i class="fab fa-linkedin"></i> ${data.linkedin}</div>
                                    ` : ''}
                                    ${data.portfolio ? `
                                        <div><i class="fas fa-globe"></i> ${data.portfolio}</div>
                                    ` : ''}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="right-column">
                            ${this.generateSummarySection(data)}
                            ${this.generateExperienceSection(data, true)}
                            ${this.generateEducationSection(data, true)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateCreativeTemplate(data) {
        return `
            <div class="cv-template creative">
                <!-- Creative Layout -->
                <div class="creative-container">
                    <!-- Sidebar -->
                    <aside class="creative-sidebar">
                        ${data.profilePic ? `
                            <div class="creative-photo">
                                <img src="${data.profilePic}" alt="Profile">
                            </div>
                        ` : ''}
                        
                        <div class="sidebar-section">
                            <h3>Contact</h3>
                            ${data.email ? `<p><i class="fas fa-envelope"></i> ${data.email}</p>` : ''}
                            ${data.phone ? `<p><i class="fas fa-phone"></i> ${data.phone}</p>` : ''}
                            ${data.address ? `<p><i class="fas fa-map-marker-alt"></i> ${data.address}</p>` : ''}
                        </div>
                        
                        ${this.generateSkillsSection(data, true)}
                    </aside>
                    
                    <!-- Main Content -->
                    <div class="creative-main">
                        <header class="creative-header">
                            <h1>${data.fullName || 'Your Name'}</h1>
                            <h2>${data.address ? data.address.split(',')[0] : 'Professional'}</h2>
                        </header>
                        
                        ${this.generateSummarySection(data)}
                        ${this.generateExperienceSection(data)}
                        ${this.generateEducationSection(data)}
                    </div>
                </div>
            </div>
        `;
    }

    // ============================================
    // SECTION GENERATORS
    // ============================================

    generateSummarySection(data) {
        if (!data.summary) return '';
        
        return `
            <section class="cv-section summary">
                <h3><i class="fas fa-user"></i> Professional Summary</h3>
                <div class="section-content">
                    <p>${data.summary.replace(/\n/g, '<br>')}</p>
                </div>
            </section>
        `;
    }

    generateExperienceSection(data, isClassic = false) {
        if (!data.experience || Object.keys(data.experience).length === 0) {
            return '';
        }
        
        const experiences = Object.values(data.experience);
        const items = experiences.map(exp => `
            <div class="experience-item">
                <div class="experience-header">
                    <h4>${exp.title || ''}</h4>
                    <span class="company">${exp.company || ''}</span>
                    <span class="duration">
                        ${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}
                    </span>
                </div>
                ${exp.description ? `
                    <div class="experience-description">
                        ${exp.description.split('\n').map(line => `<p>${line}</p>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('');
        
        return `
            <section class="cv-section experience">
                <h3><i class="fas fa-briefcase"></i> ${isClassic ? 'Professional Experience' : 'Work Experience'}</h3>
                <div class="section-content">
                    ${items}
                </div>
            </section>
        `;
    }

    generateEducationSection(data, isClassic = false) {
        if (!data.education || Object.keys(data.education).length === 0) {
            return '';
        }
        
        const educationItems = Object.values(data.education).map(edu => `
            <div class="education-item">
                <div class="education-header">
                    <h4>${edu.degree || ''}</h4>
                    <span class="institution">${edu.institution || ''}</span>
                    <span class="year">${edu.year || ''}</span>
                </div>
                ${edu.grade ? `<p class="grade">Grade: ${edu.grade}</p>` : ''}
            </div>
        `).join('');
        
        return `
            <section class="cv-section education">
                <h3><i class="fas fa-graduation-cap"></i> Education</h3>
                <div class="section-content">
                    ${educationItems}
                </div>
            </section>
        `;
    }

    generateSkillsSection(data, isCompact = false) {
        if (!data.skills || data.skills.length === 0) {
            return '';
        }
        
        const skillTags = data.skills.map(skill => 
            `<span class="skill-tag">${skill}</span>`
        ).join('');
        
        if (isCompact) {
            return `
                <section class="cv-section skills">
                    <h3><i class="fas fa-cogs"></i> Skills</h3>
                    <div class="skills-grid compact">
                        ${skillTags}
                    </div>
                </section>
            `;
        }
        
        return `
            <section class="cv-section skills">
                <h3><i class="fas fa-code"></i> Skills & Expertise</h3>
                <div class="skills-grid">
                    ${skillTags}
                </div>
            </section>
        `;
    }

    // ============================================
    // PUBLIC METHODS
    // ============================================

    generatePreview(data, template = 'modern') {
        this.cvData = data;
        this.currentTemplate = template;
        
        if (!this.templates[template]) {
            template = 'modern';
        }
        
        // Call the appropriate template method with proper context
        if (template === 'modern') {
            return this.generateModernTemplate(data);
        } else if (template === 'classic') {
            return this.generateClassicTemplate(data);
        } else if (template === 'creative') {
            return this.generateCreativeTemplate(data);
        }
        
        return this.generateModernTemplate(data);
    }

    downloadAsPDF(data, filename = 'cv.pdf') {
        // This would integrate with a PDF generation library
        // For now, we'll show a message
        alert('PDF download would be implemented with a library like jsPDF or html2pdf.js');
        
        // Example implementation concept:
        // 1. Generate HTML from template
        // 2. Convert HTML to PDF using jsPDF
        // 3. Save the PDF
    }

    printCV() {
        const printWindow = window.open('', '_blank');
        const printContent = this.generatePrintableHTML();
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    }

    generatePrintableHTML() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>CV - ${this.cvData?.fullName || 'Professional CV'}</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    ${this.getPrintStyles()}
                </style>
            </head>
            <body>
                ${this.generatePreview(this.cvData, this.currentTemplate)}
            </body>
            </html>
        `;
    }

    getPrintStyles() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            html, body {
                width: 210mm;
                height: 297mm;
                margin: 0;
                padding: 0;
            }
            
            body {
                font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
                line-height: 1.5;
                color: #333;
                background: #fff;
            }
            
            @page {
                size: A4;
                margin: 15mm 15mm 15mm 15mm;
            }
            
            @media print {
                * {
                    -webkit-print-color-adjust: exact !important;
                    color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                
                html, body {
                    width: 210mm;
                    height: 297mm;
                    margin: 0;
                    padding: 15mm;
                    page-break-after: avoid;
                }
                
                .cv-template {
                    max-width: 100%;
                    margin: 0;
                    padding: 0;
                    page-break-after: avoid;
                }
                
                .cv-template.modern {
                    max-width: 100%;
                }
                
                .cv-template.modern .cv-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #000;
                    page-break-inside: avoid;
                }
                
                .cv-template.modern .header-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 20px;
                    width: 100%;
                }
                
                .cv-template.modern .header-info {
                    flex: 1;
                }
                
                .cv-template.modern .cv-name {
                    font-size: 28px;
                    color: #000;
                    margin-bottom: 5px;
                    font-weight: bold;
                    page-break-inside: avoid;
                }
                
                .cv-template.modern .cv-title {
                    font-size: 16px;
                    color: #555;
                    margin-bottom: 10px;
                    font-weight: normal;
                }
                
                .cv-template.modern .profile-image {
                    flex-shrink: 0;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    overflow: hidden;
                    border: 2px solid #000;
                }
                
                .cv-template.modern .profile-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                .cv-template.modern .contact-info {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px 15px;
                    margin-bottom: 10px;
                }
                
                .cv-template.modern .contact-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    page-break-inside: avoid;
                }
                
                .cv-template.modern .contact-item i {
                    color: #000;
                    width: 16px;
                    font-size: 12px;
                }
                
                .cv-template.modern .contact-item a {
                    color: #000;
                    text-decoration: none;
                }
                
                .cv-template.modern .cv-section {
                    margin-bottom: 15px;
                    page-break-inside: avoid;
                }
                
                .cv-template.modern .cv-section h3 {
                    font-size: 16px;
                    color: #000;
                    margin-bottom: 10px;
                    padding-bottom: 5px;
                    border-bottom: 1px solid #ccc;
                    font-weight: bold;
                    page-break-inside: avoid;
                }
                
                .cv-template.modern .experience-item,
                .cv-template.modern .education-item {
                    margin-bottom: 12px;
                    padding-left: 10px;
                    border-left: 2px solid #ccc;
                    page-break-inside: avoid;
                }
                
                .cv-template.modern .experience-header,
                .cv-template.modern .education-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    flex-wrap: wrap;
                    margin-bottom: 5px;
                }
                
                .cv-template.modern .experience-header h4,
                .cv-template.modern .education-header h4 {
                    font-size: 14px;
                    font-weight: bold;
                    color: #000;
                    margin: 0;
                }
                
                .cv-template.modern .company,
                .cv-template.modern .institution {
                    color: #555;
                    font-style: italic;
                    font-size: 13px;
                }
                
                .cv-template.modern .duration,
                .cv-template.modern .year {
                    color: #000;
                    font-weight: normal;
                    background: transparent;
                    padding: 0;
                    border-radius: 0;
                    font-size: 12px;
                }
                
                .cv-template.modern .experience-description {
                    color: #333;
                    font-size: 13px;
                    line-height: 1.5;
                }
                
                .cv-template.modern .experience-description p {
                    margin: 3px 0;
                    position: relative;
                    padding-left: 10px;
                    font-size: 12px;
                }
                
                .cv-template.modern .experience-description p:before {
                    content: "•";
                    position: absolute;
                    left: 0;
                    color: #000;
                }
                
                .cv-template.modern .skills-grid {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                }
                
                .cv-template.modern .skill-tag {
                    background: transparent;
                    color: #000;
                    padding: 3px 8px;
                    border-radius: 3px;
                    font-size: 12px;
                    font-weight: normal;
                    border: 1px solid #000;
                    display: inline-block;
                }
                
                a {
                    color: #000;
                    text-decoration: none;
                }
                
                img {
                    max-width: 100%;
                    height: auto;
                }
                
                @media print {
                    body {
                        page-break-after: avoid;
                    }
                }
            }
        `;
    }

    changeTemplate(template) {
        if (this.templates[template]) {
            this.currentTemplate = template;
            return this.generatePreview(this.cvData, template);
        }
        return null;
    }

    getAvailableTemplates() {
        return Object.keys(this.templates);
    }

    // ============================================
    // DATA VALIDATION
    // ============================================

    validateCVData(data) {
        const errors = [];
        
        if (!data.fullName) {
            errors.push('Full name is required');
        }
        
        if (!data.email) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(data.email)) {
            errors.push('Valid email is required');
        }
        
        if (!data.skills || data.skills.length === 0) {
            errors.push('At least one skill is required');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // ============================================
    // UTILITIES
    // ============================================

    estimateReadTime(data) {
        // Estimate reading time based on content length
        let wordCount = 0;
        
        if (data.summary) {
            wordCount += data.summary.split(/\s+/).length;
        }
        
        if (data.experience) {
            Object.values(data.experience).forEach(exp => {
                if (exp.description) {
                    wordCount += exp.description.split(/\s+/).length;
                }
            });
        }
        
        // Average reading speed: 200 words per minute
        const minutes = Math.ceil(wordCount / 200);
        return minutes > 0 ? `${minutes} min read` : 'Quick read';
    }

    generateQRCode(data) {
        // This would generate a QR code for the CV
        // Implementation would require a QR code library
        return null;
    }

    // ============================================
    // EXPORT AS VARIOUS FORMATS
    // ============================================

    exportAsText(data) {
        let text = '';
        
        text += `${data.fullName || 'Your Name'}\n`;
        text += `${data.address ? data.address.split(',')[0] : 'Professional'}\n`;
        text += '='.repeat(50) + '\n\n';
        
        if (data.email) text += `Email: ${data.email}\n`;
        if (data.phone) text += `Phone: ${data.phone}\n`;
        if (data.address) text += `Address: ${data.address}\n\n`;
        
        if (data.experience && Object.keys(data.experience).length > 0) {
            text += 'EXPERIENCE\n';
            text += '-'.repeat(50) + '\n';
            Object.values(data.experience).forEach(exp => {
                text += `${exp.title || ''}\n`;
                text += `${exp.company || ''}\n`;
                text += `${exp.startDate || ''} - ${exp.current ? 'Present' : exp.endDate || ''}\n`;
                if (exp.description) {
                    text += exp.description + '\n';
                }
                text += '\n';
            });
        }
        
        if (data.education && Object.keys(data.education).length > 0) {
            text += 'EDUCATION\n';
            text += '-'.repeat(50) + '\n';
            Object.values(data.education).forEach(edu => {
                text += `${edu.degree || ''}\n`;
                text += `${edu.institution || ''}\n`;
                if (edu.year) text += `${edu.year}\n`;
                if (edu.grade) text += `GPA/Grade: ${edu.grade}\n`;
                text += '\n';
            });
        }
        
        if (data.skills && data.skills.length > 0) {
            text += 'SKILLS\n';
            text += '-'.repeat(50) + '\n';
            text += data.skills.join(', ') + '\n\n';
        }
        
        return text;
    }

    exportAsHTML(data) {
        return this.generatePreview(data, this.currentTemplate);
    }

    exportAsJSON(data) {
        return JSON.stringify(data, null, 2);
    }
}

// ============================================
// INITIALIZE CV PREVIEW GENERATOR
// ============================================

window.cvPreviewGenerator = new CVPreviewGenerator();

// Auto-update preview when form changes
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('cvForm');
    
    if (form) {
        // Debounced update function
        let updateTimeout;
        const updatePreview = () => {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                const formData = new FormData(form);
                const data = {};
                formData.forEach((value, key) => {
                    // Handle nested data
                    if (key.includes('[')) {
                        const keys = key.replace(/\[(\d+)\]/g, '.$1').split('.');
                        let current = data;
                        keys.forEach((k, i) => {
                            if (i === keys.length - 1) {
                                current[k] = value;
                            } else {
                                if (!current[k]) {
                                    current[k] = isNaN(keys[i + 1]) ? {} : [];
                                }
                                current = current[k];
                            }
                        });
                    } else {
                        data[key] = value;
                    }
                });
                
                // Update preview if on preview step
                const currentStep = document.querySelector('.form-step.active');
                if (currentStep && currentStep.dataset.step === '5') {
                    const preview = document.getElementById('cvPreview');
                    if (preview) {
                        preview.innerHTML = window.cvPreviewGenerator.generatePreview(data);
                    }
                }
            }, 500);
        };
        
        // Listen to form changes
        form.addEventListener('input', updatePreview);
        form.addEventListener('change', updatePreview);
    }
});