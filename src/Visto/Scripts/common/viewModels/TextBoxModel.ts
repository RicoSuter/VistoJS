import visto = require("libs/visto");
import validationControlModel = require("./ValidationControlModel");

export class TextBoxModel extends validationControlModel.ValidationControlModel {
    label: KnockoutObservable<string>;
    value: KnockoutObservable<string>;

    required: KnockoutObservable<boolean>;
    minLength: KnockoutObservable<number>;
    maxLength: KnockoutObservable<number>;
    validationRegex: KnockoutObservable<string>;

    requiredError: KnockoutObservable<string>;
    minLengthError: KnockoutObservable<string>;
    maxLengthError: KnockoutObservable<string>;
    validationRegexError: KnockoutObservable<string>;

    initialize(parameters: visto.Parameters) {
        this.label = this.parameters.getObservableString("label", "");
        this.value = this.parameters.getObservableString("value", "");

        this.required = this.parameters.getObservableBoolean("required", true);
        this.minLength = this.parameters.getObservableNumber("minLength", 0);
        this.maxLength = this.parameters.getObservableNumber("maxLength", 0);
        this.validationRegex = this.parameters.getObservableString("validationRegex", null);

        this.requiredError = this.parameters.getObservableString("requiredError", "Must not be empty.");
        this.minLengthError = this.parameters.getObservableString("minLengthError", "Must have at least {min} characters.");
        this.maxLengthError = this.parameters.getObservableString("maxLengthError", "Must have at most {max} characters.");
        this.validationRegexError = this.parameters.getObservableString("validationRegexError", "The regex /{regex}/ must match.");

        this.subscribe(this.value, () => { this.validate(); });

        this.subscribe(this.required, () => { this.validate(); });
        this.subscribe(this.minLength, () => { this.validate(); });
        this.subscribe(this.maxLength, () => { this.validate(); });
        this.subscribe(this.validationRegex, () => { this.validate(); });

        this.subscribe(this.requiredError, () => { this.validate(); });
        this.subscribe(this.minLengthError, () => { this.validate(); });
        this.subscribe(this.maxLengthError, () => { this.validate(); });
        this.subscribe(this.validationRegexError, () => { this.validate(); });

        super.initialize(parameters);
    }

    getValidationErrors() {
        var errors: string[] = [];
        var value = this.value();

        if (this.required() && value === "")
            return [this.requiredError()]; 

        if (this.minLength() > 0 && value.length < this.minLength())
            errors.push(this.minLengthError().replace("{min}", this.minLength().toString()));

        if (this.maxLength() > 0 && value.length > this.maxLength())
            errors.push(this.maxLengthError().replace("{max}", this.maxLength().toString()));

        if (this.validationRegex() !== null && value.match("^" + this.validationRegex() + "$") === null)
            errors.push(this.validationRegexError().replace("{regex}", this.validationRegex().toString()));

        return errors;
    }
}