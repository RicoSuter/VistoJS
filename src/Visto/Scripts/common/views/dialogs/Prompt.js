var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var Prompt = (function (_super) {
        __extends(Prompt, _super);
        function Prompt() {
            _super.apply(this, arguments);
            this.language = visto.language;
        }
        Prompt.prototype.initialize = function () {
            var _this = this;
            this.viewModel.onOkClicked = function () {
                _this.close(1 /* Ok */);
            };
            this.viewModel.onCancelClicked = function () {
                _this.close(2 /* Cancel */);
            };
        };
        Prompt.prototype.onLoaded = function () {
            var _this = this;
            var input = this.getViewElement("input");
            input.keypress(function (e) {
                if (e.which === 13)
                    _this.close(1 /* Ok */);
            });
        };
        Prompt.prototype.onShown = function () {
            var input = this.getViewElement("input");
            input.focus();
            input.select();
        };
        return Prompt;
    })(visto.Dialog);
    exports.Prompt = Prompt;
});
//# sourceMappingURL=Prompt.js.map