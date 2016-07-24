var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "./ValidationControlModel"], function (require, exports, validationControlModel) {
    "use strict";
    var CheckBoxModel = (function (_super) {
        __extends(CheckBoxModel, _super);
        function CheckBoxModel() {
            _super.apply(this, arguments);
        }
        CheckBoxModel.prototype.initialize = function (parameters) {
            this.label = this.parameters.getObservableString("label", "");
            this.checked = this.parameters.getObservableBoolean("checked", false);
        };
        return CheckBoxModel;
    }(validationControlModel.ValidationControlModel));
    exports.CheckBoxModel = CheckBoxModel;
});
//# sourceMappingURL=CheckBoxModel.js.map