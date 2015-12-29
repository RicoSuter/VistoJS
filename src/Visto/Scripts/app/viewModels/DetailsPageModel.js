var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto", "SampleService"], function (require, exports, visto, svc) {
    var DetailsPageModel = (function (_super) {
        __extends(DetailsPageModel, _super);
        function DetailsPageModel() {
            _super.apply(this, arguments);
            this.item = ko.observable();
        }
        DetailsPageModel.prototype.initialize = function (parameters) {
            if (!this.context.isPageRestore) {
                this.item(parameters.getObject("item", null));
                this.enablePageRestore(this.item().id.toString());
            }
        };
        DetailsPageModel.prototype.onLoading = function () {
            var _this = this;
            if (this.context.isPageRestore) {
                var id = Number(this.parameters.getRestoreQuery());
                return svc.getItems().then(function (items) {
                    for (var i = 0, item; (item = items[i]) !== undefined; i++) {
                        if (item.id === id)
                            _this.item(item);
                    }
                });
            }
            else
                return Q(null);
        };
        return DetailsPageModel;
    })(visto.ViewModel);
    exports.DetailsPageModel = DetailsPageModel;
    ;
});
//# sourceMappingURL=DetailsPageModel.js.map