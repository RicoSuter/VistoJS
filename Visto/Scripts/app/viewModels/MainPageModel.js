var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto", "common/main", "module"], function (require, exports, visto, common, package) {
    var MainPageModel = (function (_super) {
        __extends(MainPageModel, _super);
        function MainPageModel() {
            _super.apply(this, arguments);
        }
        MainPageModel.prototype.initialize = function () {
            this.enablePageRestore();
        };
        MainPageModel.prototype.navigateToBindings = function () {
            visto.navigateTo(package, "BindingsPage");
        };
        MainPageModel.prototype.navigateToInternationalization = function () {
            visto.navigateTo(package, "InternationalizationPage");
        };
        MainPageModel.prototype.navigateToTabPage = function () {
            visto.navigateTo(package, "TabPage");
        };
        MainPageModel.prototype.navigateToListPage = function () {
            visto.navigateTo(package, "ListPage");
        };
        MainPageModel.prototype.navigateToWebViewPage = function () {
            visto.navigateTo(package, "WebViewPage");
        };
        MainPageModel.prototype.showAlert = function () {
            common.alert(this.getString("notImplementedTitle"), this.getString("notImplementedMessage"));
        };
        MainPageModel.prototype.showCustomDialog = function () {
            visto.showDialog(package, "SampleDialog");
        };
        return MainPageModel;
    })(visto.ViewModel);
    exports.MainPageModel = MainPageModel;
    ;
});
//# sourceMappingURL=MainPageModel.js.map