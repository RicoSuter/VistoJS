var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto", "module"], function (require, exports, visto, pkg) {
    var RecursivePageModel = (function (_super) {
        __extends(RecursivePageModel, _super);
        function RecursivePageModel() {
            _super.apply(this, arguments);
        }
        RecursivePageModel.prototype.initialize = function () {
            this.enablePageRestore();
        };
        RecursivePageModel.prototype.navigate = function () {
            visto.navigateTo(pkg, "RecursivePage");
        };
        return RecursivePageModel;
    })(visto.ViewModel);
    exports.RecursivePageModel = RecursivePageModel;
});
//# sourceMappingURL=RecursivePageModel.js.map