var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var ValidationView = (function (_super) {
        __extends(ValidationView, _super);
        function ValidationView() {
            _super.apply(this, arguments);
        }
        ValidationView.prototype.initialize = function (parameters) {
            var _this = this;
            _super.prototype.initialize.call(this, parameters);
            this.validationInitial = this.parameters.getBoolean("validationInitial", false);
            this.validationEnabled = this.parameters.getObservableBoolean("validationEnabled", true);
            this.validationMessage = this.parameters.getObservableString("validationMessage", null);
            this.isValid = ko.computed(function () {
                return _this.validationMessage() === null || _this.validationMessage() === "";
            });
            this.viewModel.validationInitial = this.validationInitial;
            this.viewModel.validationEnabled = this.validationEnabled;
            this.viewModel.validationMessage = this.validationMessage;
        };
        return ValidationView;
    })(visto.View);
    exports.ValidationView = ValidationView;
});
//# sourceMappingURL=ValidationView.js.map