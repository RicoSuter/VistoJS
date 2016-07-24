var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto", "common/validation"], function (require, exports, visto, validation) {
    "use strict";
    var FormPage = (function (_super) {
        __extends(FormPage, _super);
        function FormPage() {
            _super.apply(this, arguments);
        }
        FormPage.prototype.initialize = function () {
            var formElement = this.getViewElement("form");
            var isFormValid = validation.isFormValidComputable(this, formElement);
            this.viewModel.isFormValid = isFormValid;
        };
        return FormPage;
    }(visto.Page));
    exports.FormPage = FormPage;
});
//# sourceMappingURL=FormPage.js.map