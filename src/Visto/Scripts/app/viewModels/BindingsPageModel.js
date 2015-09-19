var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var BindingsPageModel = (function (_super) {
        __extends(BindingsPageModel, _super);
        function BindingsPageModel() {
            _super.apply(this, arguments);
        }
        BindingsPageModel.prototype.initialize = function () {
            this.selectedText = ko.observable("sample");
        };
        return BindingsPageModel;
    })(visto.ViewModel);
    exports.BindingsPageModel = BindingsPageModel;
    ;
});
//# sourceMappingURL=BindingsPageModel.js.map