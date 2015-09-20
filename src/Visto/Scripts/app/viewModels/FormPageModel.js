var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var FormPageModel = (function (_super) {
        __extends(FormPageModel, _super);
        function FormPageModel() {
            _super.apply(this, arguments);
            this.hasLastName = ko.observable(true);
        }
        return FormPageModel;
    })(visto.ViewModel);
    exports.FormPageModel = FormPageModel;
});
//# sourceMappingURL=FormPageModel.js.map