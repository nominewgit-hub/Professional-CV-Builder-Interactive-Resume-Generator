// ============================================
// UPDATED CV BUILDER APP WITH FIXES
// ============================================

class CVBuilderApp {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 5;
        this.isTransitioning = false;
        this.storageManager = window.storageManager;
        this.formValidator = new FormValidator();
        this.cvPreviewGenerator = window.cvPreviewGenerator;
        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadSavedData();
        this.updateUI();
        this.startAutoSave();
    }

    cacheDOM() {
        // Basic elements
        this.steps = document.querySelectorAll('.form-step');
        this.nextBtn = document.getElementById('nextBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.progressBar = document.getElementById('progressBar');
        this.currentStepEl = document.getElementById('currentStep');
        this.completionText = document.getElementById('completionText');
        
        // Navigation dots
        this.progressDots = document.querySelectorAll('.progress-dot');
        
        // Dynamic sections
        this.addEducationBtn = document.getElementById('addEducation');
        this.addExperienceBtn = document.getElementById('addExperience');
        this.isFresherCheckbox = document.getElementById('isFresher');
        
        // Form
        this.form = document.getElementById('cvForm');
        
        // Buttons
        this.printBtn = document.getElementById('printCV');
        this.downloadBtn = document.getElementById('downloadCV');
        this.resetBtn = document.getElementById('resetForm');
        this.clearDataBtn = document.getElementById('clearData');
        this.exportDataBtn = document.getElementById('exportData');
        this.importDataBtn = document.getElementById('importData');
        
        // Image upload
        this.uploadArea = document.getElementById('uploadArea');
        this.profilePicInput = document.getElementById('profilePic');
        this.imagePreview = document.getElementById('imagePreview');
        
        // Modal
        this.modal = document.getElementById('confirmationModal');
        this.modalConfirm = document.getElementById('modalConfirm');
        this.modalCancel = document.getElementById('modalCancel');
    }

    bindEvents() {
        // Navigation buttons
        this.nextBtn.addEventListener('click', () => this.nextStep());
        this.prevBtn.addEventListener('click', () => this.prevStep());
        
        // Progress dots click
        this.progressDots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                const step = parseInt(e.currentTarget.dataset.step);
                if (step !== this.currentStep) {
                    this.goToStep(step);
                }
            });
        });
        
        // Dynamic sections
        if (this.addEducationBtn) {
            this.addEducationBtn.addEventListener('click', () => this.addEducationEntry());
        }
        
        if (this.addExperienceBtn) {
            this.addExperienceBtn.addEventListener('click', () => this.addExperienceEntry());
        }
        
        // Fresher checkbox
        if (this.isFresherCheckbox) {
            this.isFresherCheckbox.addEventListener('change', () => this.toggleFresherState());
        }
        
        // Image upload
        if (this.uploadArea && this.profilePicInput) {
            this.uploadArea.addEventListener('click', () => this.profilePicInput.click());
            this.uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                this.uploadArea.style.borderColor = 'var(--primary)';
            });
            this.uploadArea.addEventListener('dragleave', () => {
                this.uploadArea.style.borderColor = '';
            });
            this.uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                this.uploadArea.style.borderColor = '';
                if (e.dataTransfer.files.length) {
                    this.profilePicInput.files = e.dataTransfer.files;
                    this.handleImageUpload(e);
                }
            });
            this.profilePicInput.addEventListener('change', (e) => this.handleImageUpload(e));
        }
        
        // Form auto-save
        this.form.addEventListener('input', () => this.debouncedSave());
        this.form.addEventListener('change', () => this.debouncedSave());
        
        // Other buttons
        if (this.printBtn) this.printBtn.addEventListener('click', () => this.printCV());
        if (this.downloadBtn) this.downloadBtn.addEventListener('click', () => this.downloadPDF());
        if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.showConfirmModal(
            'Reset Form',
            'Are you sure you want to reset all data?',
            () => this.resetForm()
        ));
        if (this.clearDataBtn) this.clearDataBtn.addEventListener('click', () => this.showConfirmModal(
            'Clear All Data',
            'This will permanently delete all saved data. Continue?',
            () => this.clearAllData()
        ));
        if (this.exportDataBtn) this.exportDataBtn.addEventListener('click', () => this.exportData());
        if (this.importDataBtn) this.importDataBtn.addEventListener('click', () => this.importData());
        
        // Skills input
        const skillsInput = document.getElementById('skillsInput');
        if (skillsInput) {
            skillsInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    this.addSkillFromInput();
                }
            });
            
            skillsInput.addEventListener('blur', () => {
                if (skillsInput.value.trim()) {
                    this.addSkillFromInput();
                }
            });
        }
        
        // Modal events
        if (this.modalCancel) {
            this.modalCancel.addEventListener('click', () => this.hideModal());
        }
        
        // Close modal on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }

    // ============================================
    // STEP NAVIGATION (WITH TRANSITIONS)
    // ============================================

    nextStep() {
        if (this.isTransitioning) return;

        if (!this.validateCurrentStep()) {
            // Find the first invalid field in the current step
            const stepEl = this.getStepElement(this.currentStep);
            const invalidField = stepEl.querySelector('.error, [aria-invalid="true"]');
            if (invalidField) {
                invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                invalidField.focus();
            }
            this.showToast('Please check highlighted fields in this step', 'error');
            this.shakeInvalidFields();
            return;
        }

        if (this.currentStep >= this.totalSteps) {
            this.submitForm();
            return;
        }

        this.transitionToStep(this.currentStep + 1, 'next');
    }

    prevStep() {
        if (this.isTransitioning || this.currentStep <= 1) return;
        this.transitionToStep(this.currentStep - 1, 'prev');
    }

    goToStep(targetStep) {
        if (this.isTransitioning || targetStep < 1 || targetStep > this.totalSteps) return;
        
        // Validate steps up to target
        for (let i = 1; i < targetStep; i++) {
            if (!this.validateStep(i)) {
                this.showToast(`Please complete step ${i} first`, 'warning');
                this.transitionToStep(i, i > this.currentStep ? 'next' : 'prev');
                return;
            }
        }
        
        this.transitionToStep(targetStep, targetStep > this.currentStep ? 'next' : 'prev');
    }

    transitionToStep(newStep, direction) {
        this.isTransitioning = true;
        
        const currentStepEl = this.getStepElement(this.currentStep);
        const nextStepEl = this.getStepElement(newStep);
        
        // Add transition classes
        currentStepEl.classList.add(direction === 'next' ? 'slide-next-exit' : 'slide-prev-exit');
        nextStepEl.classList.add(direction === 'next' ? 'slide-next-enter' : 'slide-prev-enter');
        nextStepEl.classList.add('active');
        
        // Wait for animation
        setTimeout(() => {
            currentStepEl.classList.remove('active', 'slide-next-exit', 'slide-prev-exit');
            nextStepEl.classList.remove('slide-next-enter', 'slide-prev-enter');
            
            this.currentStep = newStep;
            this.updateUI();
            this.isTransitioning = false;
            
            // Update preview if on last step
            if (this.currentStep === 5) {
                this.updateCVPreview();
            }
            
            // Save current step
            this.saveData();
        }, 500);
    }

    getStepElement(step) {
        return document.querySelector(`.form-step[data-step="${step}"]`);
    }

    // ============================================
    // VALIDATION
    // ============================================

    validateCurrentStep() {
        return this.validateStep(this.currentStep);
    }

    validateStep(step) {
        const stepEl = this.getStepElement(step);
        const requiredInputs = stepEl.querySelectorAll('[data-validate*="required"], [required]');
        
        let isValid = true;
        
        requiredInputs.forEach(input => {
            // Skip skillsInput from generic required validation - it has special handling
            if (input.id === 'skillsInput') return;
            
            const value = input.value.trim();
            const validationString = input.getAttribute('data-validate');
            
            if (validationString && validationString.includes('required') && !value) {
                isValid = false;
                this.highlightError(input, 'This field is required');
            } else {
                this.clearError(input);
                
                // Additional validation
                if (input.type === 'email' && value) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        isValid = false;
                        this.highlightError(input, 'Please enter a valid email');
                    }
                }
                
                if (input.name === 'phone' && value) {
                    const phoneRegex = /^[\+]?[1-9][\d\s\-\(\)]{8,}$/;
                    const cleanedPhone = value.replace(/[\s\-\(\)]/g, '');
                    if (!phoneRegex.test(cleanedPhone)) {
                        isValid = false;
                        this.highlightError(input, 'Please enter a valid phone number');
                    }
                }
            }
        });
        
        // Special validation for skills (Step 3)
        if (step === 3) {
            const skillsInput = document.getElementById('skillsInput');
            // If input has value but not added as tag, auto-add it
            if (skillsInput && skillsInput.value.trim()) {
                this.addSkillFromInput();
            }
            // Now check if any skills exist
            const allSkillTags = [
                ...Array.from(document.getElementById('skillsTags')?.querySelectorAll('.tag') || [])
            ];
            const allSkills = allSkillTags.map(tag => tag.textContent.replace('×', '').trim()).filter(Boolean);
            if (allSkills.length === 0) {
                isValid = false;
                if (skillsInput) {
                    this.highlightError(skillsInput, 'Please add at least one skill (press Enter or comma after typing)');
                }
            } else {
                // Skills exist, clear any error on the input
                if (skillsInput) {
                    this.clearError(skillsInput);
                }
            }
        }
        return isValid;
    }

    highlightError(input, message) {
        input.classList.add('error');
        const errorEl = input.parentElement.querySelector('.error-message');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.classList.add('show');
        }
    }

    clearError(input) {
        input.classList.remove('error');
        const errorEl = input.parentElement.querySelector('.error-message');
        if (errorEl) {
            errorEl.classList.remove('show');
        }
    }

    shakeInvalidFields() {
        const invalidFields = document.querySelectorAll('.form-step.active .error');
        invalidFields.forEach(field => {
            field.classList.add('bounce');
            setTimeout(() => field.classList.remove('bounce'), 500);
        });
    }

    // ============================================
    // UI UPDATES
    // ============================================

    updateUI() {
        // Update progress bar
        const progress = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
        
        // Update step counter
        if (this.currentStepEl) {
            this.currentStepEl.textContent = this.currentStep;
        }
        
        // Update completion text
        const stepTexts = [
            'Personal Information',
            'Education Background',
            'Skills & Expertise',
            'Work Experience',
            'Preview & Finalize'
        ];
        if (this.completionText) {
            this.completionText.textContent = stepTexts[this.currentStep - 1] || '';
        }
        
        // Update progress dots
        if (this.progressDots) {
            this.progressDots.forEach((dot, index) => {
                const step = index + 1;
                dot.classList.toggle('active', step === this.currentStep);
                dot.classList.toggle('completed', step < this.currentStep);
            });
        }
        
        // Update navigation buttons
        if (this.prevBtn) {
            this.prevBtn.style.display = this.currentStep === 1 ? 'none' : 'flex';
        }
        
        if (this.nextBtn) {
            this.nextBtn.innerHTML = this.currentStep === this.totalSteps 
                ? 'Submit CV <i class="fas fa-check"></i>' 
                : 'Next Step <i class="fas fa-arrow-right"></i>';
        }
        
        // Update fresher checkbox state
        this.toggleFresherState();
    }

    toggleFresherState() {
        const fresherCheckbox = document.getElementById('isFresher');
        const experienceContainer = document.getElementById('experienceContainer');
        const addExperienceBtn = document.getElementById('addExperience');
        
        if (fresherCheckbox && experienceContainer && addExperienceBtn) {
            if (fresherCheckbox.checked) {
                experienceContainer.style.opacity = '0.5';
                experienceContainer.style.pointerEvents = 'none';
                addExperienceBtn.style.display = 'none';
                
                // Clear experience fields
                experienceContainer.querySelectorAll('input, textarea').forEach(field => {
                    field.value = '';
                });
            } else {
                experienceContainer.style.opacity = '1';
                experienceContainer.style.pointerEvents = 'all';
                addExperienceBtn.style.display = 'block';
            }
        }
    }

    // ============================================
    // DYNAMIC SECTIONS
    // ============================================

    addEducationEntry() {
        const container = document.getElementById('educationEntries');
        const entries = container.querySelectorAll('.education-entry');
        const nextId = entries.length + 1;
        
        const template = `
            <div class="education-entry" data-entry="${nextId}">
                <div class="entry-header">
                    <h4>Education #${nextId}</h4>
                    <button type="button" class="btn-remove-entry" onclick="app.removeEducationEntry(${nextId})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="required">
                            <i class="fas fa-certificate"></i> Degree
                        </label>
                        <input type="text" 
                               name="education[${nextId}][degree]" 
                               placeholder="Bachelor of Science in Computer Science"
                               data-validate="required">
                    </div>

                    <div class="form-group">
                        <label class="required">
                            <i class="fas fa-university"></i> Institution
                        </label>
                        <input type="text" 
                               name="education[${nextId}][institution]" 
                               placeholder="University of Technology"
                               data-validate="required">
                    </div>

                    <div class="form-group">
                        <label class="required">
                            <i class="fas fa-calendar-alt"></i> Graduation Year
                        </label>
                        <input type="number" 
                               name="education[${nextId}][year]" 
                               min="1970" 
                               max="2030"
                               placeholder="2023"
                               data-validate="required|number">
                    </div>

                    <div class="form-group">
                        <label>
                            <i class="fas fa-star"></i> GPA/Percentage
                        </label>
                        <input type="text" 
                               name="education[${nextId}][grade]" 
                               placeholder="3.8/4.0">
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', template);
        this.saveData();
        this.showToast('Education entry added', 'success');
    }

    removeEducationEntry(id) {
        const entry = document.querySelector(`.education-entry[data-entry="${id}"]`);
        if (entry) {
            entry.style.transform = 'translateX(-100%)';
            entry.style.opacity = '0';
            setTimeout(() => {
                entry.remove();
                this.saveData();
                this.showToast('Education entry removed', 'info');
            }, 300);
        }
    }

    addExperienceEntry() {
        const container = document.getElementById('experienceContainer');
        const entries = container.querySelectorAll('.experience-entry');
        const nextId = entries.length + 1;
        
        const template = `
            <div class="experience-entry" data-entry="${nextId}">
                <div class="entry-header">
                    <h4>Experience #${nextId}</h4>
                    <button type="button" class="btn-remove-entry" onclick="app.removeExperienceEntry(${nextId})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label class="required">
                            <i class="fas fa-user-tie"></i> Job Title
                        </label>
                        <input type="text" 
                               name="experience[${nextId}][title]" 
                               placeholder="Frontend Developer"
                               data-validate="required">
                    </div>

                    <div class="form-group">
                        <label class="required">
                            <i class="fas fa-building"></i> Company
                        </label>
                        <input type="text" 
                               name="experience[${nextId}][company]" 
                               placeholder="Tech Solutions Inc."
                               data-validate="required">
                    </div>

                    <div class="form-group">
                        <label class="required">
                            <i class="fas fa-calendar"></i> Start Date
                        </label>
                        <input type="month" 
                               name="experience[${nextId}][startDate]" 
                               data-validate="required">
                    </div>

                    <div class="form-group">
                        <label>
                            <i class="fas fa-calendar"></i> End Date
                        </label>
                        <input type="month" name="experience[${nextId}][endDate]" id="exp${nextId}End">
                        <div class="checkbox-inline">
                            <input type="checkbox" name="experience[${nextId}][current]" 
                                   id="exp${nextId}Current" 
                                   onchange="app.toggleEndDate(${nextId})">
                            <label for="exp${nextId}Current">Currently working here</label>
                        </div>
                    </div>

                    <div class="form-group full-width">
                        <label>
                            <i class="fas fa-tasks"></i> Responsibilities & Achievements
                        </label>
                        <textarea name="experience[${nextId}][description]" 
                                  rows="4"
                                  placeholder="• Developed responsive web applications\n• Improved performance by 40%\n• Led a team of 3 developers"></textarea>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', template);
        this.saveData();
        this.showToast('Experience entry added', 'success');
    }

    removeExperienceEntry(id) {
        const entry = document.querySelector(`.experience-entry[data-entry="${id}"]`);
        if (entry) {
            entry.style.transform = 'translateX(-100%)';
            entry.style.opacity = '0';
            setTimeout(() => {
                entry.remove();
                this.saveData();
                this.showToast('Experience entry removed', 'info');
            }, 300);
        }
    }

    toggleEndDate(id) {
        const checkbox = document.getElementById(`exp${id}Current`);
        const endDateInput = document.getElementById(`exp${id}End`);
        
        if (checkbox && endDateInput) {
            endDateInput.disabled = checkbox.checked;
            endDateInput.required = !checkbox.checked;
            if (checkbox.checked) {
                endDateInput.value = '';
            }
        }
    }

    // ============================================
    // SKILLS MANAGEMENT
    // ============================================

    addSkillFromInput() {
        const input = document.getElementById('skillsInput');
        const value = input.value.trim();
        
        if (!value) return;
        
        // Split by comma or newline
        const newSkills = value.split(/[,|\n]/)
            .map(skill => skill.trim())
            .filter(skill => skill.length > 0);
        
        // Add each skill
        newSkills.forEach(skill => this.addSkill(skill));
        
        // Clear input
        input.value = '';
        input.focus();
        this.saveData();
    }

    addSkill(skill) {
        const skillsTags = document.getElementById('skillsTags');
        const hiddenInput = document.getElementById('skillsHidden');
        
        // Check if already exists
        const existing = Array.from(skillsTags.querySelectorAll('.tag')).find(tag => 
            tag.textContent.replace('×', '').trim() === skill
        );
        
        if (existing) return;
        
        // Create tag
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            ${skill}
            <i class="fas fa-times" onclick="this.parentElement.remove(); app.updateSkillsHiddenInput();"></i>
        `;
        
        skillsTags.appendChild(tag);
        this.updateSkillsHiddenInput();
        this.updateSkillCategories();
    }

    updateSkillsHiddenInput() {
        const skillsTags = document.getElementById('skillsTags');
        const hiddenInput = document.getElementById('skillsHidden');
        
        if (!skillsTags || !hiddenInput) return;
        
        const skills = Array.from(skillsTags.querySelectorAll('.tag'))
            .map(tag => tag.textContent.replace('×', '').trim());
        
        hiddenInput.value = skills.join(',');
    }

    updateSkillCategories() {
        // This is a simplified version - in a real app, you'd categorize skills
        const skills = this.getSkillsArray();
        const technicalTags = document.getElementById('technicalTags');
        const softTags = document.getElementById('softTags');
        const languageTags = document.getElementById('languageTags');
        
        // Clear existing
        if (technicalTags) technicalTags.innerHTML = '';
        if (softTags) softTags.innerHTML = '';
        if (languageTags) languageTags.innerHTML = '';
        
        // Simple categorization (you'd expand this)
        skills.forEach(skill => {
            const tag = `<span class="category-tag">${skill}</span>`;
            if (skill.match(/(javascript|python|react|node|html|css|java|c\+\+|sql)/i)) {
                if (technicalTags) technicalTags.innerHTML += tag;
            } else if (skill.match(/(communication|leadership|teamwork|problem.solving)/i)) {
                if (softTags) softTags.innerHTML += tag;
            } else if (skill.match(/(english|spanish|french|german|chinese|japanese)/i)) {
                if (languageTags) languageTags.innerHTML += tag;
            } else {
                if (technicalTags) technicalTags.innerHTML += tag;
            }
        });
    }

    getSkillsArray() {
        const hiddenInput = document.getElementById('skillsHidden');
        return hiddenInput && hiddenInput.value ? 
            hiddenInput.value.split(',').filter(s => s.trim()) : [];
    }

    // ============================================
    // IMAGE HANDLING
    // ============================================

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file
        if (file.size > 2 * 1024 * 1024) {
            this.showToast('File size must be less than 2MB', 'error');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            this.showToast('Please select an image file', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageData = e.target.result;
            
            // Update preview
            this.imagePreview.innerHTML = `<img src="${imageData}" alt="Profile">`;
            
            // Save to storage manager - need to merge with existing data
            const existingData = this.storageManager.load() || {};
            existingData.profilePic = imageData;
            this.storageManager.save(existingData);
            
            // IMPORTANT: Refresh CV preview to show the image at the top
            this.updateCVPreview();
            
            this.showToast('Profile picture uploaded successfully', 'success');
        };
        reader.onerror = () => {
            this.showToast('Error reading image file', 'error');
        };
        reader.readAsDataURL(file);
    }

    // ============================================
    // CV PREVIEW
    // ============================================

    updateCVPreview() {
        const data = this.getFormData();
        
        // Always fetch latest profile picture from storage
        const saved = this.storageManager.load();
        if (saved && saved.profilePic) {
            data.profilePic = saved.profilePic;
        }
        
        const preview = document.getElementById('cvPreview');
        
        if (!preview) return;
        
        // Show loading
        preview.innerHTML = `
            <div class="cv-loading">
                <i class="fas fa-spinner fa-spin"></i>
                Generating CV Preview...
            </div>
        `;
        
        // Generate preview after a short delay
        setTimeout(() => {
            try {
                const html = this.cvPreviewGenerator.generatePreview(data, 'modern');
                if (html) {
                    preview.innerHTML = html;
                } else {
                    preview.innerHTML = '<div class="cv-error">Unable to generate preview. Please fill in your information.</div>';
                }
            } catch (error) {
                console.error('Preview generation error:', error);
                preview.innerHTML = '<div class="cv-error">Error generating preview. Check console for details.</div>';
            }
        }, 500);
    }

    // ============================================
    // FORM DATA MANAGEMENT
    // ============================================

    getFormData() {
        const data = {};
        
        // Collect personal information
        data.fullName = document.querySelector('input[name="fullName"]')?.value || '';
        data.email = document.querySelector('input[name="email"]')?.value || '';
        data.phone = document.querySelector('input[name="phone"]')?.value || '';
        data.address = document.querySelector('input[name="address"]')?.value || '';
        data.linkedin = document.querySelector('input[name="linkedin"]')?.value || '';
        data.portfolio = document.querySelector('input[name="portfolio"]')?.value || '';
        
        // Collect education entries
        data.education = {};
        document.querySelectorAll('.education-entry').forEach((entry, index) => {
            const entryId = entry.getAttribute('data-entry') || (index + 1);
            data.education[entryId] = {
                degree: entry.querySelector(`input[name="education[${entryId}][degree]"]`)?.value || '',
                institution: entry.querySelector(`input[name="education[${entryId}][institution]"]`)?.value || '',
                year: entry.querySelector(`input[name="education[${entryId}][year]"]`)?.value || '',
                grade: entry.querySelector(`input[name="education[${entryId}][grade]"]`)?.value || ''
            };
        });
        
        // Collect experience entries
        data.experience = {};
        document.querySelectorAll('.experience-entry').forEach((entry, index) => {
            const entryId = entry.getAttribute('data-entry') || (index + 1);
            data.experience[entryId] = {
                title: entry.querySelector(`input[name="experience[${entryId}][title]"]`)?.value || '',
                company: entry.querySelector(`input[name="experience[${entryId}][company]"]`)?.value || '',
                startDate: entry.querySelector(`input[name="experience[${entryId}][startDate]"]`)?.value || '',
                endDate: entry.querySelector(`input[name="experience[${entryId}][endDate]"]`)?.value || '',
                current: entry.querySelector(`input[name="experience[${entryId}][current]"]`)?.checked || false,
                description: entry.querySelector(`textarea[name="experience[${entryId}][description]"]`)?.value || ''
            };
        });
        
        // Add skills
        data.skills = this.getSkillsArray();
        
        // Add profile pic if exists
        const saved = this.storageManager.load();
        if (saved && saved.profilePic) {
            data.profilePic = saved.profilePic;
        }
        
        return data;
    }

    // ============================================
    // STORAGE MANAGEMENT (INTEGRATED)
    // ============================================

    debouncedSave() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveData(), 1000);
    }

    saveData() {
        const data = this.getFormData();
        data.currentStep = this.currentStep;
        data.lastSaved = new Date().toISOString();
        
        this.storageManager.save(data);
        
        // Update save status
        const saveStatus = document.getElementById('autoSaveStatus');
        if (saveStatus) {
            saveStatus.innerHTML = '<i class="fas fa-check"></i> Auto-saved';
            saveStatus.style.color = 'var(--success)';
            setTimeout(() => {
                saveStatus.innerHTML = '<i class="fas fa-save"></i> Auto-save enabled';
                saveStatus.style.color = '';
            }, 2000);
        }
    }

    loadSavedData() {
        const saved = this.storageManager.load();
        if (!saved) return;
        
        // Restore current step
        this.currentStep = saved.currentStep || 1;
        
        // Update UI
        this.updateUI();
        
        // Show current step
        this.steps.forEach(step => step.classList.remove('active'));
        const currentStepEl = this.getStepElement(this.currentStep);
        if (currentStepEl) currentStepEl.classList.add('active');
        
        // Restore form data
        this.restoreFormData(saved);
        
        // Restore profile picture
        if (saved.profilePic && this.imagePreview) {
            this.imagePreview.innerHTML = `<img src="${saved.profilePic}" alt="Profile">`;
        }
        
        this.showToast('Previous session restored', 'success');
    }

    restoreFormData(data) {
        // Simplified restoration - in a real app, you'd populate each field
        Object.keys(data).forEach(key => {
            if (key !== 'currentStep' && key !== 'lastSaved' && key !== 'profilePic') {
                const element = this.form.querySelector(`[name="${key}"]`);
                if (element && data[key] !== undefined) {
                    element.value = data[key];
                }
            }
        });
    }

    startAutoSave() {
        this.storageManager.startAutoSave(() => this.getFormData(), 30000);
    }

    clearAllData() {
        this.storageManager.clear();
        localStorage.removeItem('cvProfilePic');
        this.form.reset();
        
        // Clear skills
        const skillsTags = document.getElementById('skillsTags');
        if (skillsTags) skillsTags.innerHTML = '';
        
        // Clear image preview
        if (this.imagePreview) this.imagePreview.innerHTML = '';
        
        // Reset to step 1
        this.currentStep = 1;
        this.updateUI();
        this.steps.forEach(step => step.classList.remove('active'));
        this.getStepElement(1).classList.add('active');
        
        this.showToast('All data cleared successfully', 'success');
        this.hideModal();
    }

    exportData() {
        const data = this.getFormData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cv-data.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Data exported successfully', 'success');
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        this.storageManager.save(data);
                        this.loadSavedData();
                        this.showToast('Data imported successfully', 'success');
                    } catch {
                        this.showToast('Invalid data file', 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    // ============================================
    // FORM SUBMISSION & OUTPUT
    // ============================================

    submitForm() {
        // Validate all steps
        for (let i = 1; i <= this.totalSteps; i++) {
            if (!this.validateStep(i)) {
                this.showToast(`Please complete step ${i}`, 'error');
                this.goToStep(i);
                return;
            }
        }
        
        // Get final data
        const formData = this.getFormData();
        
        // Show success
        this.showToast('CV submitted successfully!', 'success');
        
        // Log data (in real app, send to server)
        console.log('CV Data:', formData);
        
        // Ask to print
        setTimeout(() => {
            if (confirm('CV submitted! Would you like to print it?')) {
                this.printCV();
            }
        }, 1000);
    }

    printCV() {
        const data = this.getFormData();
        
        // Always fetch latest profile picture from storage
        const saved = this.storageManager.load();
        if (saved && saved.profilePic) {
            data.profilePic = saved.profilePic;
        }
        
        const printContent = this.cvPreviewGenerator.generatePrintableHTML(data);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            // Wait for images to load before printing
            const images = printWindow.document.querySelectorAll('img');
            if (images.length > 0) {
                let loadedCount = 0;
                images.forEach(img => {
                    if (img.complete) {
                        loadedCount++;
                    } else {
                        img.onload = () => {
                            loadedCount++;
                            if (loadedCount === images.length) {
                                printWindow.print();
                            }
                        };
                        img.onerror = () => {
                            loadedCount++;
                            if (loadedCount === images.length) {
                                printWindow.print();
                            }
                        };
                    }
                });
                if (loadedCount === images.length) {
                    printWindow.print();
                }
            } else {
                printWindow.print();
            }
            
            // Close after printing (user can stop it)
            setTimeout(() => printWindow.close(), 1000);
        }, 500);
    }

    downloadPDF() {
        this.showToast('PDF download feature requires additional setup', 'info');
        // In a real app, you'd integrate a PDF library here
    }

    resetForm() {
        this.form.reset();
        this.currentStep = 1;
        this.updateUI();
        
        // Reset steps display
        this.steps.forEach(step => step.classList.remove('active'));
        this.getStepElement(1).classList.add('active');
        
        // Clear skills
        const skillsTags = document.getElementById('skillsTags');
        if (skillsTags) skillsTags.innerHTML = '';
        
        // Clear image
        if (this.imagePreview) this.imagePreview.innerHTML = '';
        
        this.showToast('Form reset successfully', 'info');
        this.hideModal();
    }

    // ============================================
    // MODAL & TOAST SYSTEM
    // ============================================

    showConfirmModal(title, message, confirmCallback) {
        const modalTitle = document.getElementById('modalTitle');
        const modalMessage = document.getElementById('modalMessage');
        
        if (modalTitle && modalMessage) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            
            this.modalConfirm.onclick = () => {
                confirmCallback();
                this.hideModal();
            };
            
            this.modal.classList.add('show');
        }
    }

    hideModal() {
        this.modal.classList.remove('show');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// ============================================
// INITIALIZE APP
// ============================================

// Create global instance
window.app = new CVBuilderApp();

// Make helper functions globally available
window.toggleEndDate = (id) => window.app.toggleEndDate(id);
window.removeEducationEntry = (id) => window.app.removeEducationEntry(id);
window.removeExperienceEntry = (id) => window.app.removeExperienceEntry(id);
window.updateSkillsHiddenInput = () => window.app.updateSkillsHiddenInput();