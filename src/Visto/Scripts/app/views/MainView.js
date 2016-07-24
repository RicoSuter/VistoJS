var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto", "module"], function (require, exports, visto, pkg) {
    "use strict";
    var MainView = (function (_super) {
        __extends(MainView, _super);
        function MainView() {
            _super.apply(this, arguments);
        }
        MainView.prototype.onLoading = function () {
            var frame = this.getViewElement("frame");
            return this.context.initializeFrame(frame, pkg, "HomePage");
        };
        return MainView;
    }(visto.ViewBase));
    exports.MainView = MainView;
});
//# sourceMappingURL=MainView.js.map