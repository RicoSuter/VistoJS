import visto = require("libs/visto");

export class ValidationControlModel extends visto.ViewModel {
    private originalValidationMessage: string;

    isValid: KnockoutComputed<boolean>;
    isValidDisplay: KnockoutComputed<boolean>;

    validateNext: boolean;
    validationEnabled: KnockoutObservable<boolean>;
    validationError: KnockoutObservable<string>;

    validationErrors = ko.observableArray<string>();

    initialize(parameters: visto.Parameters) {
        this.validateNext = this.parameters.getBoolean("validationInitial", false);

        this.validationEnabled = this.parameters.getObservableBoolean("validationEnabled", true);
        this.validationError = this.parameters.getObservableString("validationError", null);

        this.isValid = ko.computed(() => {
            var hasValidationErrors = this.validationErrors().length > 0;
            var isValidationEnabled = this.validationEnabled();
            return !hasValidationErrors || !isValidationEnabled;
        });

        this.isValidDisplay = ko.computed(() => {
            return this.isValid() || !this.validateNext;
        });

        this.subscribe(this.validationEnabled, () => { this.validate(); });
        this.subscribe(this.validationError, () => { this.validate(); });
        
        this.validate(this.validateNext);
    }

    validate(resetValidateNext?: boolean) {
        if (resetValidateNext === undefined || resetValidateNext)
            this.validateNext = true;

        var errors = this.getValidationErrors();
        var error = this.validationError(); 
        if (error !== null && error !== "")
            errors.push(error);

        this.validationErrors(errors);
    }

    /**
     * [Replaceable]
     */
    getValidationErrors(): string[] {
        return [];
    }
}