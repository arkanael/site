document.addEventListener('DOMContentLoaded', function () {
    // Menu mobile toggle
    const menuButton = document.querySelector('.menu-button');
    const menu = document.querySelector('.menu');

    if (menuButton && menu) {
        menuButton.addEventListener('click', function () {
            menu.classList.toggle('active');
            const isExpanded = menu.classList.contains('active');
            menuButton.setAttribute('aria-expanded', isExpanded);
        });
    }

    // Fechar menu ao clicar em um link (mobile)
    const menuLinks = document.querySelectorAll('.menu-link');

    menuLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth < 1024) {
                menu.classList.remove('active');
                menuButton.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Fechar menu ao redimensionar para desktop
    window.addEventListener('resize', function () {
        if (window.innerWidth >= 1024) {
            menu.classList.remove('active');
            menuButton.setAttribute('aria-expanded', 'false');
        }
    });

    // Dropdown menus functionality
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
        const dropdownMenu = dropdown.querySelector('.dropdown-menu');

        if (dropdownToggle && dropdownMenu) {
            dropdownToggle.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                // Fechar outros dropdowns
                dropdowns.forEach(otherDropdown => {
                    if (otherDropdown !== dropdown) {
                        otherDropdown.classList.remove('active');
                        const otherToggle = otherDropdown.querySelector('.dropdown-toggle');
                        if (otherToggle) {
                            otherToggle.setAttribute('aria-expanded', 'false');
                        }
                    }
                });

                // Toggle do dropdown atual
                dropdown.classList.toggle('active');
                const isExpanded = dropdown.classList.contains('active');
                dropdownToggle.setAttribute('aria-expanded', isExpanded);
            });

            // Fechar dropdown ao clicar em um item (mobile)
            const dropdownItems = dropdown.querySelectorAll('.dropdown-item');
            dropdownItems.forEach(item => {
                item.addEventListener('click', function () {
                    if (window.innerWidth < 1024) {
                        dropdown.classList.remove('active');
                        dropdownToggle.setAttribute('aria-expanded', 'false');
                        menu.classList.remove('active');
                        menuButton.setAttribute('aria-expanded', 'false');
                    }
                });
            });
        }
    });

    // Fechar todos os dropdowns ao clicar fora
    document.addEventListener('click', function (e) {
        const clickedDropdown = e.target.closest('.dropdown');
        if (!clickedDropdown) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
                const toggle = dropdown.querySelector('.dropdown-toggle');
                if (toggle) {
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        }
    });

    // Fechar dropdowns ao pressionar ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            dropdowns.forEach(dropdown => {
                if (dropdown.classList.contains('active')) {
                    dropdown.classList.remove('active');
                    const toggle = dropdown.querySelector('.dropdown-toggle');
                    if (toggle) {
                        toggle.setAttribute('aria-expanded', 'false');
                        toggle.focus();
                    }
                }
            });
        }
    });

    // Intersection Observer para animações de entrada
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, observerOptions);

    // Animação para logos dos parceiros
    const partnerLogos = document.querySelectorAll('.partner-logo');
    partnerLogos.forEach((logo) => {
        logo.style.opacity = '0';
        logo.style.transform = 'translateY(20px)';
        logo.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(logo);
    });

    // Animação simples para os cards de informação
    const infoItems = document.querySelectorAll('.info-item');
    infoItems.forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        item.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(item);
    });

    // Animação simples para os botões de apoio
    const supportButtons = document.querySelectorAll('.support-btn');
    supportButtons.forEach((btn, index) => {
        btn.style.opacity = '0';
        btn.style.transform = 'translateY(20px)';
        btn.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        btn.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(btn);
    });

    // Animação simples para os cards de projeto
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.transitionDelay = `${index * 0.1}s`;
        observer.observe(card);
    });

    // ===== DONATION PAGE FUNCTIONALITY =====

    // Initialize donation form functionality only if we're on the donation page
    if (document.getElementById('donationForm')) {

        // Generate security token (simplified version)
        function generateSecurityToken() {
            return btoa(Date.now() + Math.random().toString(36)).substring(0, 32);
        }

        // Initialize security token on page load
        const securityTokenField = document.getElementById('securityToken');
        if (securityTokenField) {
            securityTokenField.value = generateSecurityToken();
        }

        // Amount Selection Component
        const amountButtons = document.querySelectorAll('.amount-btn');
        const customAmountInput = document.getElementById('customAmount');
        const amountError = document.getElementById('amountError');
        const donateButton = document.querySelector('.donate-btn');

        let selectedAmount = null;
        let selectedPaymentMethod = null;

        // Security: Input sanitization utility
        function sanitizeInput(input) {
            if (typeof input !== 'string') return input;
            return input
                .replace(/[<>]/g, '') // Remove potential HTML tags
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .replace(/on\w+=/gi, '') // Remove event handlers
                .trim();
        }

        // Security: Rate limiting for form submissions
        let lastSubmissionTime = 0;
        const SUBMISSION_COOLDOWN = 3000; // 3 seconds between submissions

        function canSubmitForm() {
            const now = Date.now();
            if (now - lastSubmissionTime < SUBMISSION_COOLDOWN) {
                return false;
            }
            lastSubmissionTime = now;
            return true;
        }

        // Amount selection state management
        function selectAmount(amount, isCustom = false) {
            selectedAmount = amount;

            // Clear all amount button selections
            amountButtons.forEach(btn => btn.classList.remove('selected'));

            if (!isCustom) {
                // Clear custom amount input
                customAmountInput.value = '';
                customAmountInput.classList.remove('valid', 'error');
                hideError(amountError);
            }

            updateDonateButton();
        }

        // Predefined amount button handlers
        amountButtons.forEach(button => {
            button.addEventListener('click', function () {
                const amount = parseFloat(this.dataset.amount);

                // Toggle selection
                if (this.classList.contains('selected')) {
                    this.classList.remove('selected');
                    selectedAmount = null;
                } else {
                    selectAmount(amount);
                    this.classList.add('selected');
                }

                updateDonateButton();
            });

            // Keyboard accessibility
            button.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });

        // Custom amount input validation
        function validateAmount(value) {
            const amount = parseFloat(value);

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

        // Format currency input
        function formatCurrency(input) {
            let value = input.value.replace(/[^\d,]/g, '');

            // Replace comma with dot for parsing
            const numericValue = parseFloat(value.replace(',', '.'));

            if (!isNaN(numericValue)) {
                // Format back to Brazilian currency format
                input.value = numericValue.toFixed(2).replace('.', ',');
            }
        }

        // Custom amount input handlers
        if (customAmountInput) {
            customAmountInput.addEventListener('input', function () {
                const value = this.value.replace(',', '.');
                const validation = validateAmount(value);

                if (this.value.trim() === '') {
                    // Empty input - clear selection and validation
                    selectedAmount = null;
                    this.classList.remove('valid', 'error');
                    hideError(amountError);
                    selectAmount(null);
                } else if (validation.valid) {
                    // Valid amount
                    selectedAmount = parseFloat(value);
                    this.classList.remove('error');
                    this.classList.add('valid');
                    hideError(amountError);
                    selectAmount(selectedAmount, true);
                } else {
                    // Invalid amount
                    selectedAmount = null;
                    this.classList.remove('valid');
                    this.classList.add('error');
                    showError(amountError, validation.message);
                }

                updateDonateButton();
            });

            customAmountInput.addEventListener('blur', function () {
                if (this.value.trim() !== '') {
                    formatCurrency(this);
                }
            });

            // Prevent non-numeric input (except comma and dot)
            customAmountInput.addEventListener('keypress', function (e) {
                const char = e.key;
                if (!/[\d,.]/.test(char) && char !== 'Backspace' && char !== 'Delete' && char !== 'ArrowLeft' && char !== 'ArrowRight' && char !== 'Tab') {
                    e.preventDefault();
                }
            });
        }

        // Payment method selection
        const paymentMethodButtons = document.querySelectorAll('.payment-method-btn');

        paymentMethodButtons.forEach(button => {
            button.addEventListener('click', function () {
                // Clear all selections
                paymentMethodButtons.forEach(btn => btn.classList.remove('selected'));

                // Select current method
                this.classList.add('selected');
                selectedPaymentMethod = this.dataset.method;

                // Show conditional form fields based on payment method
                showPaymentMethodFields(selectedPaymentMethod);

                updateDonateButton();
            });

            // Keyboard accessibility
            button.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.click();
                }
            });
        });

        // Show conditional form fields based on payment method
        function showPaymentMethodFields(method) {
            // Remove any existing payment-specific fields
            const existingFields = document.querySelector('.payment-specific-fields');
            if (existingFields) {
                existingFields.remove();
            }

            // Create container for payment-specific fields
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

            // Animate the appearance of the fields
            setTimeout(() => {
                fieldsContainer.classList.add('show');
            }, 50);
        }

        // Error message utilities
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

        // Update donate button state
        function updateDonateButton() {
            if (donateButton) {
                const isValid = selectedAmount && selectedAmount > 0 && selectedPaymentMethod;
                donateButton.disabled = !isValid;

                if (isValid) {
                    donateButton.innerHTML = `
                    <i class="fas fa-heart"></i>
                    Doar R$ ${selectedAmount.toFixed(2).replace('.', ',')}
                `;
                } else {
                    donateButton.innerHTML = `
                    <i class="fas fa-heart"></i>
                    Finalizar doação
                `;
                }
            }
        }

        // Form validation for donor information
        const donorForm = document.getElementById('donationForm');
        const nameInput = document.getElementById('donorName');
        const emailInput = document.getElementById('donorEmail');
        const phoneInput = document.getElementById('donorPhone');

        // Enhanced name validation with real-time feedback
        if (nameInput) {
            nameInput.addEventListener('blur', function () {
                validateName(this);
            });

            nameInput.addEventListener('input', function () {
                // Sanitize input as user types
                this.value = sanitizeInput(this.value);

                // Real-time validation feedback
                if (this.value.length > 0) {
                    validateName(this);
                } else {
                    // Clear validation state when empty
                    this.classList.remove('error', 'valid');
                    hideError(document.getElementById('nameError'));
                }
            });

            // Prevent potentially harmful input
            nameInput.addEventListener('keypress', function (e) {
                const char = e.key;
                // Allow letters, spaces, hyphens, and apostrophes only
                if (!/[a-zA-ZÀ-ÿ\s\-']/.test(char) && char !== 'Backspace' && char !== 'Delete' && char !== 'ArrowLeft' && char !== 'ArrowRight' && char !== 'Tab') {
                    e.preventDefault();
                }
            });
        }

        function validateName(input) {
            const value = sanitizeInput(input.value.trim());
            const errorElement = document.getElementById('nameError');

            // Check minimum length
            if (value.length < 2) {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'Nome deve ter pelo menos 2 caracteres');
                return false;
            }

            // Check maximum length
            if (value.length > 100) {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'Nome muito longo (máximo 100 caracteres)');
                return false;
            }

            // Check for valid name pattern (letters, spaces, hyphens, apostrophes)
            const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
            if (!nameRegex.test(value)) {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'Nome deve conter apenas letras, espaços e hífens');
                return false;
            }

            // Check for at least one letter (not just spaces/symbols)
            if (!/[a-zA-ZÀ-ÿ]/.test(value)) {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'Nome deve conter pelo menos uma letra');
                return false;
            }

            input.classList.remove('error');
            input.classList.add('valid');
            hideError(errorElement);
            return true;
        }

        // Enhanced email validation with real-time feedback
        if (emailInput) {
            emailInput.addEventListener('blur', function () {
                validateEmail(this);
            });

            emailInput.addEventListener('input', function () {
                // Sanitize input as user types
                this.value = sanitizeInput(this.value);

                // Real-time validation feedback
                if (this.value.length > 0) {
                    validateEmail(this);
                } else {
                    // Clear validation state when empty
                    this.classList.remove('error', 'valid');
                    hideError(document.getElementById('emailError'));
                }
            });

            // Convert to lowercase as user types
            emailInput.addEventListener('input', function () {
                this.value = this.value.toLowerCase();
            });
        }

        function validateEmail(input) {
            const value = sanitizeInput(input.value.trim().toLowerCase());
            const errorElement = document.getElementById('emailError');

            // Check if empty (required field)
            if (value.length === 0) {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'E-mail é obrigatório');
                return false;
            }

            // Check maximum length
            if (value.length > 254) {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'E-mail muito longo');
                return false;
            }

            // Enhanced email regex pattern
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

            if (!emailRegex.test(value)) {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'Por favor, insira um e-mail válido');
                return false;
            }

            // Check for common typos in domain
            const commonDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'uol.com.br', 'terra.com.br'];
            const domain = value.split('@')[1];
            const suspiciousDomains = ['gmial.com', 'gmai.com', 'hotmial.com', 'yahooo.com'];

            if (suspiciousDomains.includes(domain)) {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'Verifique se o e-mail está correto');
                return false;
            }

            input.classList.remove('error');
            input.classList.add('valid');
            hideError(errorElement);
            return true;
        }

        // Enhanced phone validation (optional field)
        if (phoneInput) {
            phoneInput.addEventListener('input', function () {
                formatPhone(this);

                // Real-time validation for optional field
                if (this.value.trim() !== '') {
                    validatePhone(this);
                } else {
                    // Clear validation state when empty (optional field)
                    this.classList.remove('error', 'valid');
                    hideError(document.getElementById('phoneError'));
                }
            });

            phoneInput.addEventListener('blur', function () {
                if (this.value.trim() !== '') {
                    validatePhone(this);
                }
            });

            // Only allow numbers, spaces, parentheses, and hyphens
            phoneInput.addEventListener('keypress', function (e) {
                const char = e.key;
                if (!/[\d\s\(\)\-]/.test(char) && char !== 'Backspace' && char !== 'Delete' && char !== 'ArrowLeft' && char !== 'ArrowRight' && char !== 'Tab') {
                    e.preventDefault();
                }
            });
        }

        function formatPhone(input) {
            // Remove all non-digit characters
            let value = input.value.replace(/\D/g, '');

            // Limit to 11 digits (Brazilian mobile format)
            if (value.length > 11) {
                value = value.substring(0, 11);
            }

            // Format based on length
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

        function validatePhone(input) {
            const value = input.value.trim();
            const errorElement = document.getElementById('phoneError');

            // If empty, it's valid (optional field)
            if (value === '') {
                input.classList.remove('error', 'valid');
                hideError(errorElement);
                return true;
            }

            // Check for valid Brazilian phone format
            const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

            if (!phoneRegex.test(value)) {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'Formato: (21) 99999-9999');
                return false;
            }

            // Extract digits for additional validation
            const digits = value.replace(/\D/g, '');

            // Check if it's a valid Brazilian area code (11-99)
            const areaCode = parseInt(digits.substring(0, 2));
            if (areaCode < 11 || areaCode > 99) {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'Código de área inválido');
                return false;
            }

            // Check mobile number format (9 digits starting with 9)
            if (digits.length === 11 && digits[2] !== '9') {
                input.classList.add('error');
                input.classList.remove('valid');
                showError(errorElement, 'Número de celular deve começar com 9');
                return false;
            }

            input.classList.remove('error');
            input.classList.add('valid');
            hideError(errorElement);
            return true;
        }

        // Enhanced form submission with security measures
        if (donorForm) {
            donorForm.addEventListener('submit', function (e) {
                e.preventDefault();

                // Security: Rate limiting check
                if (!canSubmitForm()) {
                    showError(document.getElementById('nameError'), 'Aguarde alguns segundos antes de tentar novamente');
                    return;
                }

                // Disable submit button to prevent double submission
                const submitButton = donateButton;
                const originalButtonText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

                // Validate all fields with enhanced validation
                const isNameValid = validateName(nameInput);
                const isEmailValid = validateEmail(emailInput);
                const isPhoneValid = phoneInput.value.trim() === '' || validatePhone(phoneInput);
                const isAmountValid = selectedAmount && selectedAmount > 0;
                const isPaymentValid = selectedPaymentMethod;

                // Additional security validation
                const securityChecks = performSecurityChecks();

                if (isNameValid && isEmailValid && isPhoneValid && isAmountValid && isPaymentValid && securityChecks) {
                    // Sanitize and collect form data
                    const formData = {
                        amount: selectedAmount,
                        paymentMethod: selectedPaymentMethod,
                        donor: {
                            name: sanitizeInput(nameInput.value.trim()),
                            email: sanitizeInput(emailInput.value.trim().toLowerCase()),
                            phone: phoneInput.value.trim() || null
                        },
                        timestamp: new Date().toISOString(),
                        userAgent: navigator.userAgent,
                        referrer: document.referrer || 'direct'
                    };

                    // Security: Add CSRF-like token (in real implementation, this would come from server)
                    formData.token = generateSecurityToken();

                    // Log donation attempt (in production, send to server)
                    console.log('Donation submission:', {
                        ...formData,
                        userAgent: undefined // Don't log sensitive data
                    });

                    // Simulate processing delay
                    setTimeout(() => {
                        // Show success message with better UX
                        showSuccessMessage(formData);

                        // Reset form state
                        resetFormState();

                        // Re-enable button
                        submitButton.disabled = false;
                        submitButton.innerHTML = originalButtonText;
                    }, 2000);

                } else {
                    // Re-enable button on validation failure
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;

                    // Show validation summary
                    showValidationSummary();

                    // Scroll to first error
                    const firstError = donorForm.querySelector('.error');
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        firstError.focus();
                    }
                }
            });
        }

        // Security checks function
        function performSecurityChecks() {
            // Check for suspicious patterns
            const suspiciousPatterns = [
                /<script/i,
                /javascript:/i,
                /on\w+=/i,
                /eval\(/i,
                /document\./i
            ];

            const allInputs = [nameInput.value, emailInput.value, phoneInput.value].join(' ');

            for (const pattern of suspiciousPatterns) {
                if (pattern.test(allInputs)) {
                    console.warn('Suspicious input detected');
                    return false;
                }
            }

            return true;
        }

        // Show success message with better UX
        function showSuccessMessage(formData) {
            const successHTML = `
            <div class="success-overlay">
                <div class="success-modal">
                    <div class="success-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h3>Doação confirmada!</h3>
                    <p>Obrigado, <strong>${formData.donor.name}</strong>!</p>
                    <p>Sua doação de <strong>R$ ${formData.amount.toFixed(2).replace('.', ',')}</strong> foi registrada.</p>
                    <p>Você receberá as instruções de pagamento no e-mail <strong>${formData.donor.email}</strong>.</p>
                    <button class="success-btn" onclick="closeSuccessModal()">
                        <i class="fas fa-heart"></i>
                        Continuar
                    </button>
                </div>
            </div>
        `;

            document.body.insertAdjacentHTML('beforeend', successHTML);

            // Auto-close after 10 seconds
            setTimeout(() => {
                closeSuccessModal();
            }, 10000);
        }

        // Close success modal function (global scope for onclick)
        window.closeSuccessModal = function () {
            const overlay = document.querySelector('.success-overlay');
            if (overlay) {
                overlay.remove();
            }
        };

        // Reset form state after successful submission
        function resetFormState() {
            // Clear selections
            selectedAmount = null;
            selectedPaymentMethod = null;

            // Clear amount buttons
            amountButtons.forEach(btn => btn.classList.remove('selected'));

            // Clear payment method buttons
            paymentMethodButtons.forEach(btn => btn.classList.remove('selected'));

            // Clear custom amount
            if (customAmountInput) {
                customAmountInput.value = '';
                customAmountInput.classList.remove('valid', 'error');
            }

            // Clear form inputs
            if (nameInput) {
                nameInput.value = '';
                nameInput.classList.remove('valid', 'error');
            }
            if (emailInput) {
                emailInput.value = '';
                emailInput.classList.remove('valid', 'error');
            }
            if (phoneInput) {
                phoneInput.value = '';
                phoneInput.classList.remove('valid', 'error');
            }

            // Clear all error messages
            document.querySelectorAll('.error-message').forEach(error => {
                hideError(error);
            });

            // Remove payment-specific fields
            const paymentFields = document.querySelector('.payment-specific-fields');
            if (paymentFields) {
                paymentFields.remove();
            }

            // Update button state
            updateDonateButton();
        }

        // Show validation summary
        function showValidationSummary() {
            const errors = [];

            if (!selectedAmount || selectedAmount <= 0) {
                errors.push('Selecione um valor para doação');
            }
            if (!selectedPaymentMethod) {
                errors.push('Escolha uma forma de pagamento');
            }
            if (!validateName(nameInput)) {
                errors.push('Nome inválido');
            }
            if (!validateEmail(emailInput)) {
                errors.push('E-mail inválido');
            }
            if (phoneInput.value.trim() !== '' && !validatePhone(phoneInput)) {
                errors.push('Telefone inválido');
            }

            if (errors.length > 0) {
                const errorSummary = `Por favor, corrija os seguintes erros:\n• ${errors.join('\n• ')}`;

                // Show in a more user-friendly way than alert
                const existingSummary = document.querySelector('.validation-summary');
                if (existingSummary) {
                    existingSummary.remove();
                }

                const summaryHTML = `
                <div class="validation-summary">
                    <div class="validation-content">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>Por favor, corrija os seguintes erros:</strong>
                            <ul>${errors.map(error => `<li>${error}</li>`).join('')}</ul>
                        </div>
                        <button class="close-summary" onclick="this.parentElement.parentElement.remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;

                donorForm.insertAdjacentHTML('afterbegin', summaryHTML);

                // Auto-hide after 8 seconds
                setTimeout(() => {
                    const summary = document.querySelector('.validation-summary');
                    if (summary) {
                        summary.remove();
                    }
                }, 8000);
            }
        }

        // Initialize donate button state
        updateDonateButton();

    } // End of donation form functionality check

    // Add hover effects to value cards
    const valueCards = document.querySelectorAll('.donation-value-card');
    valueCards.forEach(card => {
        card.addEventListener('click', function () {
            // Add click effect
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Add smooth scrolling to anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Initialize form validation for contact forms
    const contactForms = document.querySelectorAll('.contact-form');
    contactForms.forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Basic form validation
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;

            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('error');
                    isValid = false;
                } else {
                    field.classList.remove('error');
                }
            });

            if (isValid) {
                // Show success message
                showNotification('Formulário enviado com sucesso! Entraremos em contato em breve.', 'success');

                // Reset form after a delay
                setTimeout(() => {
                    form.reset();
                    form.querySelectorAll('.error, .valid').forEach(field => {
                        field.classList.remove('error', 'valid');
                    });
                }, 1000);
            } else {
                showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
            }
        });
    });

}); // End of first DOMContentLoaded

// ===== DONATION PAGES SPECIFIC FUNCTIONS =====

// Copy to clipboard functionality for PIX keys
function copyToClipboard(text, button) {
    // Try to use the modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () {
            showCopySuccess(button);
        }).catch(function (err) {
            // Fallback to older method
            fallbackCopyToClipboard(text, button);
        });
    } else {
        // Fallback for older browsers or non-HTTPS contexts
        fallbackCopyToClipboard(text, button);
    }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess(button);
        } else {
            showCopyError(button);
        }
    } catch (err) {
        showCopyError(button);
    }

    document.body.removeChild(textArea);
}

// Show success feedback when copying
function showCopySuccess(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
    button.style.background = 'var(--success)';

    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 2000);

    // Show notification
    showNotification('Chave PIX copiada com sucesso!', 'success');
}

// Show error feedback when copying fails
function showCopyError(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-times"></i> Erro';
    button.style.background = 'var(--error, #dc3545)';

    setTimeout(() => {
        button.innerHTML = originalText;
        button.style.background = '';
    }, 2000);

    // Show notification
    showNotification('Erro ao copiar. Tente selecionar e copiar manualmente.', 'error');
}

// Show notification function (if not already defined)
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success, #28a745)' : type === 'error' ? 'var(--error, #dc3545)' : 'var(--primary-blue, #007bff)'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: var(--border-radius-md, 8px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        font-weight: 600;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

    const icon = type === 'success' ? 'check' : type === 'error' ? 'times' : 'info-circle';
    notification.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;

    document.body.appendChild(notification);

    // Animate entrance
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto-remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

