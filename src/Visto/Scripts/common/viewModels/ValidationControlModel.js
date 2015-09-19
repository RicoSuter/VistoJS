var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var ValidationControlModel = (function (_super) {
        __extends(ValidationControlModel, _super);
        function ValidationControlModel() {
            _super.apply(this, arguments);
            this.validationErrors = ko.observableArray();
        }
        ValidationControlModel.prototype.initialize = function (parameters) {
            var _this = this;
            this.validateNext = this.parameters.getBoolean("validationInitial", false);
            this.validationEnabled = this.parameters.getObservableBoolean("validationEnabled", true);
            this.validationError = this.parameters.getObservableString("validationError", null);
            this.isValid = ko.computed(function () {
                var hasValidationErrors = _this.validationErrors().length > 0;
                var isValidationEnabled = _this.validationEnabled();
                return !hasValidationErrors || !isValidationEnabled;
            });
            this.isValidDisplay = ko.computed(function () {
                return _this.isValid() || !_this.validateNext;
            });
            this.subscribe(this.validationEnabled, function () { _this.validate(); });
            this.subscribe(this.validationError, function () { _this.validate(); });
            this.validate(this.validateNext);
        };
        ValidationControlModel.prototype.validate = function (resetValidateNext) {
            if (resetValidateNext === undefined || resetValidateNext)
                this.validateNext = true;
            var errors = this.getValidationErrors();
            var error = this.validationError();
            if (error !== null && error !== "")
                errors.push(error);
            this.validationErrors(errors);
        };
        /**
         * [Replaceable]
         */
        ValidationControlModel.prototype.getValidationErrors = function () {
            return [];
        };
        return ValidationControlModel;
    })(visto.ViewModel);
    exports.ValidationControlModel = ValidationControlModel;
});
//# sourceMappingURL=ValidationControlModel.js.map