var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto", "common/main", "module"], function (require, exports, visto, common, package) {
    var HomePageModel = (function (_super) {
        __extends(HomePageModel, _super);
        function HomePageModel() {
            _super.apply(this, arguments);
        }
        HomePageModel.prototype.initialize = function () {
            this.enablePageRestore();
        };
        HomePageModel.prototype.navigateToBindings = function () {
            visto.navigateTo(package, "BindingsPage");
        };
        HomePageModel.prototype.navigateToInternationalization = function () {
            visto.navigateTo(package, "InternationalizationPage");
        };
        HomePageModel.prototype.navigateToTabPage = function () {
            visto.navigateTo(package, "TabPage");
        };
        HomePageModel.prototype.navigateToListPage = function () {
            visto.navigateTo(package, "ListPage");
        };
        HomePageModel.prototype.navigateToWebViewPage = function () {
            visto.navigateTo(package, "WebViewPage");
        };
        HomePageModel.prototype.showAlert = function () {
            common.alert(this.getString("notImplementedTitle"), this.getString("notImplementedMessage"));
        };
        HomePageModel.prototype.showCustomDialog = function () {
            visto.showDialog(package, "SampleDialog");
        };
        return HomePageModel;
    })(visto.ViewModel);
    exports.HomePageModel = HomePageModel;
    ;
});
//# sourceMappingURL=HomePageModel.js.map