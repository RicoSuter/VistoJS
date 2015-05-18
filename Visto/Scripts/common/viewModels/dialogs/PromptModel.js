var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var PromptModel = (function (_super) {
        __extends(PromptModel, _super);
        function PromptModel() {
            _super.apply(this, arguments);
        }
        PromptModel.prototype.initialize = function (parameters) {
            this.message = parameters.getObservable("message");
            this.output = parameters.getObservable("output", "");
        };
        return PromptModel;
    })(visto.ViewModel);
    exports.PromptModel = PromptModel;
});
//# sourceMappingURL=PromptModel.js.map