var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto", "module"], function (require, exports, visto, pkg) {
    "use strict";
    var RecursivePageModel = (function (_super) {
        __extends(RecursivePageModel, _super);
        function RecursivePageModel() {
            _super.apply(this, arguments);
        }
        RecursivePageModel.prototype.initialize = function () {
            this.enablePageRestore();
        };
        RecursivePageModel.prototype.navigate = function () {
            this.context.navigateTo(pkg, "RecursivePage").done();
        };
        return RecursivePageModel;
    }(visto.ViewModel));
    exports.RecursivePageModel = RecursivePageModel;
});
//# sourceMappingURL=RecursivePageModel.js.map