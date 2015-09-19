var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "./ValidationControlModel"], function (require, exports, validationControlModel) {
    var TextBoxModel = (function (_super) {
        __extends(TextBoxModel, _super);
        function TextBoxModel() {
            _super.apply(this, arguments);
        }
        TextBoxModel.prototype.initialize = function (parameters) {
            var _this = this;
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
            this.subscribe(this.value, function () { _this.validate(); });
            this.subscribe(this.required, function () { _this.validate(); });
            this.subscribe(this.minLength, function () { _this.validate(); });
            this.subscribe(this.maxLength, function () { _this.validate(); });
            this.subscribe(this.validationRegex, function () { _this.validate(); });
            this.subscribe(this.requiredError, function () { _this.validate(); });
            this.subscribe(this.minLengthError, function () { _this.validate(); });
            this.subscribe(this.maxLengthError, function () { _this.validate(); });
            this.subscribe(this.validationRegexError, function () { _this.validate(); });
            _super.prototype.initialize.call(this, parameters);
        };
        TextBoxModel.prototype.getValidationErrors = function () {
            var errors = [];
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
        };
        return TextBoxModel;
    })(validationControlModel.ValidationControlModel);
    exports.TextBoxModel = TextBoxModel;
});
//# sourceMappingURL=TextBoxModel.js.map