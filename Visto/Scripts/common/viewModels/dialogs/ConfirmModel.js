var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var ConfirmModel = (function (_super) {
        __extends(ConfirmModel, _super);
        function ConfirmModel() {
            _super.apply(this, arguments);
        }
        ConfirmModel.prototype.initialize = function (parameters) {
            this.message = parameters.getValue("message");
        };
        return ConfirmModel;
    })(visto.VistoViewModel);
    exports.ConfirmModel = ConfirmModel;
});
//# sourceMappingURL=ConfirmModel.js.map