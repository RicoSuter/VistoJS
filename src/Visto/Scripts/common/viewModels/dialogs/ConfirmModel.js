var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var ConfirmModel = (function (_super) {
        __extends(ConfirmModel, _super);
        function ConfirmModel() {
            _super.apply(this, arguments);
        }
        ConfirmModel.prototype.initialize = function (parameters) {
            this.title = parameters.getString("title");
            this.message = parameters.getString("message");
            this.buttons = parameters.getObject("buttons");
        };
        return ConfirmModel;
    })(visto.ViewModel);
    exports.ConfirmModel = ConfirmModel;
});
//# sourceMappingURL=ConfirmModel.js.map