var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "./ValidationViewModel"], function (require, exports, validationViewModel) {
    var InputBoxModel = (function (_super) {
        __extends(InputBoxModel, _super);
        function InputBoxModel() {
            _super.apply(this, arguments);
        }
        InputBoxModel.prototype.initialize = function (parameters) {
            var _this = this;
            this.label = this.parameters.getObservableString("label", "");
            this.value = this.parameters.getObservableString("value", "");
            this.required = this.parameters.getObservableBoolean("required", true);
            this.subscribe(this.value, function () { _this.validate(); });
            this.subscribe(this.required, function () { _this.validate(); });
            _super.prototype.initialize.call(this, parameters);
        };
        InputBoxModel.prototype.getValidationMessage = function () {
            var value = this.value();
            if (this.required() && value === "")
                return "The field is required.";
            return null;
        };
        return InputBoxModel;
    })(validationViewModel.ValidationViewModel);
    exports.InputBoxModel = InputBoxModel;
});
//# sourceMappingURL=InputBoxModel.js.map