var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports"], function (require, exports) {
    var TabControlView = (function (_super) {
        __extends(TabControlView, _super);
        function TabControlView() {
            _super.apply(this, arguments);
        }
        TabControlView.prototype.initialize = function (parameters) {
            this.view;
        };
        return TabControlView;
    })(visto.VistoViewBase);
    exports.TabControlView = TabControlView;
});
//# sourceMappingURL=TabControl.js.map