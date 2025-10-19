// ===== DONATION FORM JAVASCRIPT FUNCTIONALITY =====
// Task 7: Implement donation form JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the donation page
    if (!document.getElementById('donationForm')) {
        return;
    }

    // ===== FORM STATE MANAGEMENT =====
    
    const formState = {
        amount: null,
        paymentMethod: null,
        donorInfo: {
            name: '',
            email: '',
            phone: ''
        },
        isValid: false,
        step: 1, // 1: Amount, 2: Payment, 3: Info, 4: Confirmation
        errors: {}
    };

    // ===== DOM ELEMENTS =====
    
    const donationForm = document.getElementById('donationForm');
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('customAmount');
    const paymentMethodButtons = document.querySelectorAll('.payment-method-btn');
    const donateButton = document.querySelector('.donate-btn');
    const securityTokenField = document.getElementById('securityToken');
    
    // Form inputs
    const nameInput = document.getElementById('donorName');
    const emailInput = document.getElementById('donorEmail');
    const phoneInput = document.getElementById('donorPhone');
    
    // Error elements
    const amountError = document.getElementById('amountError');
    const nameError = document.getElementById('nameError');
    const emailError = document.getElementById('emailError');
    const phoneError = document.getElementById('phoneError');

    // ===== ACCESSIBILITY UTILITIES =====
    
    // Screen reader announcements
    function announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }
    
    // Focus management
    function manageFocus() {
        // Set initial focus to first interactive element
        const firstAmountBtn = document.querySelector('.amount-btn');
        if (firstAmountBtn) {
            firstAmountBtn.setAttribute('tabindex', '0');
        }
        
        // Set up tab order for amount buttons
        amountButtons.forEach((btn, index) => {
            btn.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });
        
        // Set up tab order for payment method buttons
        paymentMethodButtons.forEach((btn, index) => {
            btn.setAttribute('tabindex', index === 0 ? '0' : '-1');
        });
    }
    
    // Update button states for screen readers
    function updateButtonStates() {
        // Update amount button states
        amountButtons.forEach(btn => {
            const isSelected = btn.classList.contains('selected');
            btn.setAttribute('aria-pressed', isSelected.toString());
            
            if (isSelected) {
                btn.setAttribute('tabindex', '0');
                btn.setAttribute('aria-label', `${btn.textContent} - selecionado`);
            } else {
                btn.setAttribute('tabindex', '-1');
                btn.setAttribute('aria-label', `Doar ${btn.textContent}`);
            }
        });
    }
    
    // ===== SECURITY UTILITIES =====
    
    // Generate CSRF token
    function generateSecurityToken() {
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Input sanitization
    function sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    }

    // Rate limiting for form submissions
    let lastSubmissionTime = 0;
    const SUBMISSION_COOLDOWN = 3000; // 3 seconds

    function canSubmitForm() {
        const now = Date.now();
        if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
            return false;
        }
        lastSubmissionTime = now;
        return true;
    }

    // ===== CURRENCY FORMATTING UTILITIES =====
    
    function formatCurrency(value) {
        if (typeof value === 'string') {
            value = parseFloat(value.replace(',', '.'));
        }
        if (isNaN(value)) return 'R$ 0,00';
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }

    function parseCurrency(value) {
        if (typeof value === 'number') return value;
        return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    }

    function formatCurrencyInput(input) {
        let value = input.value.replace(/[^\d,]/g, '');
        const numericValue = parseFloat(value.replace(',', '.'));
        
        if (!isNaN(numericValue)) {
            input.value = numericValue.toFixed(2).replace('.', ',');
        }
    }

    // ===== VALIDATION UTILITIES =====
    
    function validateAmount(value) {
        const amount = typeof value === 'string' ? parseCurrency(value) : value;
        
        if (isNaN(amount) || amount <= 0) {
            return { valid: false, message: 'Por favor, insira um valor válido' };
        }
        
        if (amount < 5) {
            return { valid: false, message: 'O valor mínimo para doação é R$ 5,00' };
        }
        
        if (amount > 10000) {
            return { valid: false, message: 'Para doações acima de R$ 10.000, entre em contato conosco' };
        }
        
        return { valid: true, message: '' };
    }

    function validateName(value) {
        const sanitized = sanitizeInput(value.trim());
        
        if (sanitized.length < 2) {
            return { valid: false, message: 'Nome deve ter pelo menos 2 caracteres' };
        }
        
        if (sanitized.length > 100) {
            return { valid: false, message: 'Nome muito longo (máximo 100 caracteres)' };
        }
        
        const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
        if (!nameRegex.test(sanitized)) {
            return { valid: false, message: 'Nome deve conter apenas letras, espaços e hífens' };
        }
        
        if (!/[a-zA-ZÀ-ÿ]/.test(sanitized)) {
            return { valid: false, message: 'Nome deve conter pelo menos uma letra' };
        }
        
        return { valid: true, message: '' };
    }

    function validateEmail(value) {
        const sanitized = sanitizeInput(value.trim().toLowerCase());
        
        if (sanitized.length === 0) {
            return { valid: false, message: 'E-mail é obrigatório' };
        }
        
        if (sanitized.length > 254) {
            return { valid: false, message: 'E-mail muito longo' };
        }
        
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        
        if (!emailRegex.test(sanitized)) {
            return { valid: false, message: 'Por favor, insira um e-mail válido' };
        }
        
        // Check for common typos
        const suspiciousDomains = ['gmial.com', 'gmai.com', 'hotmial.com', 'yahooo.com'];
        const domain = sanitized.split('@')[1];
        
        if (suspiciousDomains.includes(domain)) {
            return { valid: false, message: 'Verifique se o e-mail está correto' };
        }
        
        return { valid: true, message: '' };
    }

    function validatePhone(value) {
        if (!value || value.trim() === '') {
            return { valid: true, message: '' }; // Optional field
        }
        
        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        
        if (!phoneRegex.test(value)) {
            return { valid: false, message: 'Formato: (21) 99999-9999' };
        }
        
        const digits = value.replace(/\D/g, '');
        const areaCode = parseInt(digits.substring(0, 2));
        
        if (areaCode < 11 || areaCode > 99) {
            return { valid: false, message: 'Código de área inválido' };
        }
        
        if (digits.length === 11 && digits[2] !== '9') {
            return { valid: false, message: 'Número de celular deve começar com 9' };
        }
        
        return { valid: true, message: '' };
    }

    // ===== ERROR HANDLING UTILITIES =====
    
    function showError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    function hideError(errorElement) {
        if (errorElement) {
            errorElement.classList.remove('show');
            setTimeout(() => {
                errorElement.textContent = '';
            }, 300);
        }
    }

    function setFieldValidation(input, errorElement, isValid, message = '') {
        if (isValid) {
            input.classList.remove('error');
            input.classList.add('valid');
            hideError(errorElement);
        } else {
            input.classList.remove('valid');
            input.classList.add('error');
            showError(errorElement, message);
        }
    }

    // ===== AMOUNT SELECTION MANAGEMENT =====
    
    function selectAmount(amount, isCustom = false) {
        formState.amount = amount;
        
        // Clear all amount button selections
        amountButtons.forEach(btn => btn.classList.remove('selected'));
        
        if (!isCustom && customAmountInput) {
            // Clear custom amount input
            customAmountInput.value = '';
            customAmountInput.classList.remove('valid', 'error');
            hideError(amountError);
        }
        
        updateFormState();
        updateDonateButton();
    }

    // Predefined amount button handlers
    amountButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            const amount = parseFloat(this.dataset.amount);
            
            // Toggle selection
            if (this.classList.contains('selected')) {
                this.classList.remove('selected');
                formState.amount = null;
                // Announce to screen readers
                announceToScreenReader('Valor de doação desmarcado');
            } else {
                selectAmount(amount);
                this.classList.add('selected');
                // Announce to screen readers
                announceToScreenReader(`Valor de ${formatCurrency(amount)} selecionado`);
            }
            
            updateFormState();
            updateDonateButton();
        });
        
        // Enhanced keyboard accessibility
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (index + 1) % amountButtons.length;
                amountButtons[nextIndex].focus();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (index - 1 + amountButtons.length) % amountButtons.length;
                amountButtons[prevIndex].focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                amountButtons[0].focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                amountButtons[amountButtons.length - 1].focus();
            }
        });
    });

    // Custom amount input handlers
    if (customAmountInput) {
        customAmountInput.addEventListener('input', function() {
            const value = this.value.replace(',', '.');
            const validation = validateAmount(value);
            
            if (this.value.trim() === '') {
                formState.amount = null;
                this.classList.remove('valid', 'error');
                hideError(amountError);
                selectAmount(null);
            } else if (validation.valid) {
                formState.amount = parseFloat(value);
                this.classList.remove('error');
                this.classList.add('valid');
                hideError(amountError);
                selectAmount(formState.amount, true);
            } else {
                formState.amount = null;
                this.classList.remove('valid');
                this.classList.add('error');
                showError(amountError, validation.message);
            }
            
            updateFormState();
            updateDonateButton();
        });
        
        customAmountInput.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                formatCurrencyInput(this);
            }
        });
        
        // Prevent non-numeric input
        customAmountInput.addEventListener('keypress', function(e) {
            const char = e.key;
            if (!/[\d,.]/.test(char) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(char)) {
                e.preventDefault();
            }
        });
    }

    // ===== PAYMENT METHOD SELECTION =====
    
    paymentMethodButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            // Clear all selections
            paymentMethodButtons.forEach(btn => {
                btn.classList.remove('selected');
                btn.setAttribute('aria-pressed', 'false');
            });
            
            // Select current method
            this.classList.add('selected');
            this.setAttribute('aria-pressed', 'true');
            formState.paymentMethod = this.dataset.method;
            
            // Announce to screen readers
            const methodName = this.querySelector('span').textContent;
            announceToScreenReader(`Forma de pagamento ${methodName} selecionada`);
            
            // Show conditional form fields
            showPaymentMethodFields(formState.paymentMethod);
            
            updateFormState();
            updateDonateButton();
        });
        
        // Enhanced keyboard accessibility
        button.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndex = (index + 1) % paymentMethodButtons.length;
                paymentMethodButtons[nextIndex].focus();
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndex = (index - 1 + paymentMethodButtons.length) % paymentMethodButtons.length;
                paymentMethodButtons[prevIndex].focus();
            } else if (e.key === 'Home') {
                e.preventDefault();
                paymentMethodButtons[0].focus();
            } else if (e.key === 'End') {
                e.preventDefault();
                paymentMethodButtons[paymentMethodButtons.length - 1].focus();
            }
        });
        
        // Initialize ARIA attributes
        button.setAttribute('role', 'button');
        button.setAttribute('aria-pressed', 'false');
    });

    // ===== PAYMENT METHOD CONDITIONAL FIELDS =====
    
    function showPaymentMethodFields(method) {
        // Remove existing fields
        const existingFields = document.querySelector('.payment-specific-fields');
        if (existingFields) {
            existingFields.remove();
        }
        
        // Create container
        const paymentSection = document.querySelector('.payment-methods').parentNode;
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'payment-specific-fields';
        
        let fieldsHTML = '';
        
        switch (method) {
            case 'pix':
                fieldsHTML = `
                    <div class="payment-info pix-info">
                        <div class="info-card">
                            <div class="info-icon">
                                <i class="fas fa-qrcode"></i>
                            </div>
                            <div class="info-content">
                                <h4>Pagamento via PIX</h4>
                                <p>Após confirmar a doação, você receberá as instruções para pagamento via PIX por e-mail.</p>
                                <ul class="pix-benefits">
                                    <li><i class="fas fa-check"></i> Pagamento instantâneo</li>
                                    <li><i class="fas fa-check"></i> Disponível 24h por dia</li>
                                    <li><i class="fas fa-check"></i> Sem taxas adicionais</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case 'credit_card':
                fieldsHTML = `
                    <div class="payment-info credit-card-info">
                        <div class="info-card">
                            <div class="info-icon">
                                <i class="fas fa-credit-card"></i>
                            </div>
                            <div class="info-content">
                                <h4>Cartão de Crédito</h4>
                                <p>Você será redirecionado para nossa plataforma de pagamento segura.</p>
                                <div class="card-brands">
                                    <i class="fab fa-cc-visa"></i>
                                    <i class="fab fa-cc-mastercard"></i>
                                    <i class="fab fa-cc-amex"></i>
                                    <i class="fab fa-cc-diners-club"></i>
                                </div>
                                <ul class="card-benefits">
                                    <li><i class="fas fa-shield-alt"></i> Pagamento 100% seguro</li>
                                    <li><i class="fas fa-lock"></i> Dados criptografados</li>
                                    <li><i class="fas fa-receipt"></i> Recibo automático</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
                break;
                
            case 'bank_transfer':
                fieldsHTML = `
                    <div class="payment-info bank-transfer-info">
                        <div class="info-card">
                            <div class="info-icon">
                                <i class="fas fa-university"></i>
                            </div>
                            <div class="info-content">
                                <h4>Transferência Bancária</h4>
                                <p>Após confirmar a doação, você receberá nossos dados bancários por e-mail.</p>
                                <div class="bank-info-preview">
                                    <div class="bank-detail">
                                        <strong>Banco:</strong> Banco do Brasil
                                    </div>
                                    <div class="bank-detail">
                                        <strong>Conta:</strong> Conta Corrente
                                    </div>
                                    <div class="bank-detail">
                                        <strong>CNPJ:</strong> XX.XXX.XXX/0001-XX
                                    </div>
                                </div>
                                <ul class="transfer-benefits">
                                    <li><i class="fas fa-check"></i> Sem taxas para o doador</li>
                                    <li><i class="fas fa-check"></i> Comprovante automático</li>
                                    <li><i class="fas fa-check"></i> Processamento em 1-2 dias úteis</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
                break;
        }
        
        fieldsContainer.innerHTML = fieldsHTML;
        paymentSection.appendChild(fieldsContainer);
        
        // Animate appearance
        setTimeout(() => {
            fieldsContainer.classList.add('show');
        }, 50);
    }

    // ===== DONOR INFORMATION VALIDATION =====
    
    // Name input handlers
    if (nameInput) {
        nameInput.addEventListener('input', function() {
            this.value = sanitizeInput(this.value);
            formState.donorInfo.name = this.value;
            
            if (this.value.length > 0) {
                const validation = validateName(this.value);
                setFieldValidation(this, nameError, validation.valid, validation.message);
            } else {
                this.classList.remove('error', 'valid');
                hideError(nameError);
            }
            
            updateFormState();
        });
        
        nameInput.addEventListener('blur', function() {
            if (this.value.trim() !== '') {
                const validation = validateName(this.value);
                setFieldValidation(this, nameError, validation.valid, validation.message);
            }
        });
        
        nameInput.addEventListener('keypress', function(e) {
            const char = e.key;
            if (!/[a-zA-ZÀ-ÿ\s\-']/.test(char) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(char)) {
                e.preventDefault();
            }
        });
    }

    // Email input handlers
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            this.value = sanitizeInput(this.value.toLowerCase());
            formState.donorInfo.email = this.value;
            
            if (this.value.length > 0) {
                const validation = validateEmail(this.value);
                setFieldValidation(this, emailError, validation.valid, validation.message);
            } else {
                this.classList.remove('error', 'valid');
                hideError(emailError);
            }
            
            updateFormState();
        });
        
        emailInput.addEventListener('blur', function() {
            const validation = validateEmail(this.value);
            setFieldValidation(this, emailError, validation.valid, validation.message);
        });
    }

    // Phone input handlers
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhone(this);
            formState.donorInfo.phone = this.value;
            
            const validation = validatePhone(this.value);
            setFieldValidation(this, phoneError, validation.valid, validation.message);
            
            updateFormState();
        });
        
        phoneInput.addEventListener('keypress', function(e) {
            const char = e.key;
            if (!/[\d\s\(\)\-]/.test(char) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(char)) {
                e.preventDefault();
            }
        });
    }

    function formatPhone(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 11) {
            value = value.substring(0, 11);
        }
        
        if (value.length <= 2) {
            input.value = value;
        } else if (value.length <= 6) {
            input.value = `(${value.substring(0, 2)}) ${value.substring(2)}`;
        } else if (value.length <= 10) {
            input.value = `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6)}`;
        } else {
            input.value = `(${value.substring(0, 2)}) ${value.substring(2, 7)}-${value.substring(7)}`;
        }
    }

    // ===== DONATION FLOW PROGRESS TRACKING =====
    
    function updateFormState() {
        // Determine current step based on completed fields
        if (!formState.amount) {
            formState.step = 1;
        } else if (!formState.paymentMethod) {
            formState.step = 2;
        } else if (!isValidDonorInfo()) {
            formState.step = 3;
        } else {
            formState.step = 4;
        }
        
        // Update form validity
        formState.isValid = formState.amount && 
                           formState.paymentMethod && 
                           isValidDonorInfo();
        
        // Update progress indicator if it exists
        updateProgressIndicator();
    }

    function isValidDonorInfo() {
        const nameValid = validateName(formState.donorInfo.name).valid;
        const emailValid = validateEmail(formState.donorInfo.email).valid;
        const phoneValid = validatePhone(formState.donorInfo.phone).valid;
        
        return nameValid && emailValid && phoneValid;
    }

    function updateProgressIndicator() {
        // Create or update progress indicator
        let progressIndicator = document.querySelector('.donation-progress');
        
        if (!progressIndicator) {
            progressIndicator = document.createElement('div');
            progressIndicator.className = 'donation-progress';
            progressIndicator.innerHTML = `
                <div class="progress-steps">
                    <div class="progress-step" data-step="1">
                        <div class="step-number">1</div>
                        <div class="step-label">Valor</div>
                    </div>
                    <div class="progress-step" data-step="2">
                        <div class="step-number">2</div>
                        <div class="step-label">Pagamento</div>
                    </div>
                    <div class="progress-step" data-step="3">
                        <div class="step-number">3</div>
                        <div class="step-label">Dados</div>
                    </div>
                    <div class="progress-step" data-step="4">
                        <div class="step-number">4</div>
                        <div class="step-label">Confirmação</div>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
            `;
            
            // Insert after form header
            const formHeader = document.querySelector('.form-header');
            if (formHeader) {
                formHeader.insertAdjacentElement('afterend', progressIndicator);
            }
        }
        
        // Update step states
        const steps = progressIndicator.querySelectorAll('.progress-step');
        const progressFill = progressIndicator.querySelector('.progress-fill');
        
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.remove('active', 'completed');
            
            if (stepNumber < formState.step) {
                step.classList.add('completed');
            } else if (stepNumber === formState.step) {
                step.classList.add('active');
            }
        });
        
        // Update progress bar
        const progressPercentage = ((formState.step - 1) / 3) * 100;
        if (progressFill) {
            progressFill.style.width = `${progressPercentage}%`;
        }
    }

    // ===== DONATE BUTTON STATE MANAGEMENT =====
    
    function updateDonateButton() {
        if (!donateButton) return;
        
        const isValid = formState.isValid;
        donateButton.disabled = !isValid;
        
        // Update button text and accessibility attributes
        if (isValid && formState.amount) {
            donateButton.innerHTML = `
                <i class="fas fa-heart" aria-hidden="true"></i>
                Doar ${formatCurrency(formState.amount)}
            `;
            donateButton.setAttribute('aria-label', `Finalizar doação de ${formatCurrency(formState.amount)}`);
        } else {
            donateButton.innerHTML = `
                <i class="fas fa-heart" aria-hidden="true"></i>
                Finalizar doação
            `;
            
            if (!isValid) {
                const missingFields = [];
                if (!formState.amount) missingFields.push('valor');
                if (!formState.paymentMethod) missingFields.push('forma de pagamento');
                if (!isValidDonorInfo()) missingFields.push('dados pessoais');
                
                donateButton.setAttribute('aria-label', 
                    `Finalizar doação - preencha: ${missingFields.join(', ')}`);
            }
        }
        
        // Update screen reader description
        const submitHelp = document.getElementById('submit-help');
        if (submitHelp) {
            if (isValid) {
                submitHelp.textContent = 'Clique para finalizar sua doação';
            } else {
                const missingFields = [];
                if (!formState.amount) missingFields.push('valor da doação');
                if (!formState.paymentMethod) missingFields.push('forma de pagamento');
                if (!isValidDonorInfo()) missingFields.push('dados pessoais');
                
                submitHelp.textContent = `Preencha os seguintes campos: ${missingFields.join(', ')}`;
            }
        }
    }

    // ===== FORM SUBMISSION HANDLING =====
    
    if (donationForm) {
        donationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Security checks
            if (!canSubmitForm()) {
                showFormMessage('Por favor, aguarde antes de enviar novamente.', 'error');
                return;
            }
            
            // Final validation
            if (!formState.isValid) {
                showFormMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
                return;
            }
            
            // Show loading state
            showLoadingState();
            
            // Simulate form submission (replace with actual API call)
            setTimeout(() => {
                handleFormSubmission();
            }, 2000);
        });
    }

    function showLoadingState() {
        if (donateButton) {
            donateButton.disabled = true;
            donateButton.innerHTML = `
                <i class="fas fa-spinner fa-spin"></i>
                Processando...
            `;
        }
    }

    function handleFormSubmission() {
        // Create donation object
        const donationData = {
            id: generateSecurityToken(),
            amount: formState.amount,
            currency: 'BRL',
            paymentMethod: formState.paymentMethod,
            donor: {
                name: sanitizeInput(formState.donorInfo.name),
                email: sanitizeInput(formState.donorInfo.email),
                phone: sanitizeInput(formState.donorInfo.phone)
            },
            status: 'pending',
            createdAt: new Date().toISOString(),
            metadata: {
                source: 'website',
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            }
        };
        
        // Log donation data (replace with actual API call)
        console.log('Donation submitted:', donationData);
        
        // Show success message
        showSuccessMessage(donationData);
        
        // Reset form state
        resetForm();
    }

    function showSuccessMessage(donationData) {
        const successHTML = `
            <div class="donation-success">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Doação confirmada!</h3>
                <p>Obrigado pela sua generosidade, ${donationData.donor.name}!</p>
                <div class="donation-details">
                    <div class="detail-item">
                        <strong>Valor:</strong> ${formatCurrency(donationData.amount)}
                    </div>
                    <div class="detail-item">
                        <strong>Método:</strong> ${getPaymentMethodLabel(donationData.paymentMethod)}
                    </div>
                    <div class="detail-item">
                        <strong>ID da doação:</strong> ${donationData.id}
                    </div>
                </div>
                <p class="success-message">
                    Você receberá as instruções de pagamento por e-mail em breve.
                </p>
                <div class="success-actions">
                    <button type="button" class="btn-primary" onclick="location.reload()">
                        Fazer nova doação
                    </button>
                    <a href="index.html" class="btn-secondary">
                        Voltar ao site
                    </a>
                </div>
            </div>
        `;
        
        // Replace form with success message
        const formContainer = document.querySelector('.donation-form-container');
        if (formContainer) {
            formContainer.innerHTML = successHTML;
        }
    }

    function getPaymentMethodLabel(method) {
        const labels = {
            'pix': 'PIX',
            'credit_card': 'Cartão de Crédito',
            'bank_transfer': 'Transferência Bancária'
        };
        return labels[method] || method;
    }

    function showFormMessage(message, type = 'info') {
        // Remove existing messages
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new message
        const messageElement = document.createElement('div');
        messageElement.className = `form-message ${type}`;
        messageElement.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;
        
        // Insert at top of form
        const formContainer = document.querySelector('.donation-form-container');
        if (formContainer) {
            formContainer.insertBefore(messageElement, formContainer.firstChild);
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }

    function resetForm() {
        // Reset form state
        formState.amount = null;
        formState.paymentMethod = null;
        formState.donorInfo = { name: '', email: '', phone: '' };
        formState.isValid = false;
        formState.step = 1;
        
        // Reset form elements
        if (donationForm) {
            donationForm.reset();
        }
        
        // Clear selections
        amountButtons.forEach(btn => btn.classList.remove('selected'));
        paymentMethodButtons.forEach(btn => btn.classList.remove('selected'));
        
        // Clear validation states
        const inputs = [nameInput, emailInput, phoneInput, customAmountInput];
        inputs.forEach(input => {
            if (input) {
                input.classList.remove('valid', 'error');
            }
        });
        
        // Hide all errors
        const errors = [amountError, nameError, emailError, phoneError];
        errors.forEach(error => hideError(error));
        
        // Remove payment-specific fields
        const paymentFields = document.querySelector('.payment-specific-fields');
        if (paymentFields) {
            paymentFields.remove();
        }
        
        // Generate new security token
        if (securityTokenField) {
            securityTokenField.value = generateSecurityToken();
        }
        
        // Update button state
        updateDonateButton();
        updateFormState();
    }

    // ===== INITIALIZATION =====
    
    function initializeDonationForm() {
        // Generate initial security token
        if (securityTokenField) {
            securityTokenField.value = generateSecurityToken();
        }
        
        // Initialize accessibility features
        manageFocus();
        updateButtonStates();
        
        // Set initial form state
        updateFormState();
        updateDonateButton();
        
        // Add form validation classes
        if (donationForm) {
            donationForm.classList.add('donation-form-initialized');
        }
        
        // Announce page load to screen readers
        setTimeout(() => {
            announceToScreenReader('Página de doação carregada. Use Tab para navegar pelos campos.');
        }, 1000);
        
        console.log('Donation form initialized successfully');
    }

    // Initialize the form
    initializeDonationForm();
});