var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var ButtonModel = (function (_super) {
        __extends(ButtonModel, _super);
        function ButtonModel() {
            _super.apply(this, arguments);
            this.content = ko.observable("");
        }
        ButtonModel.prototype.initialize = function () {
            this.enabled = this.parameters.getObservableBoolean("enabled", true);
            this.content(this.parameters.tagContentHtml);
            this.click = this.parameters.getFunction("click", this);
        };
        return ButtonModel;
    })(visto.ViewModel);
    exports.ButtonModel = ButtonModel;
});
//# sourceMappingURL=ButtonModel.js.map