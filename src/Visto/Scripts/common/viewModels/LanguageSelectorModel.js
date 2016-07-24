var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    "use strict";
    var LanguageSelectorModel = (function (_super) {
        __extends(LanguageSelectorModel, _super);
        function LanguageSelectorModel() {
            _super.apply(this, arguments);
        }
        LanguageSelectorModel.prototype.initialize = function () {
            var _this = this;
            this.language = ko.observable(this.context.language());
            this.supportedLanguages = this.context.supportedLanguages;
            this.subscribe(this.language, function () {
                _this.context.setLanguage(_this.language(), _this.supportedLanguages);
            });
            this.subscribe(this.context.language, function () {
                _this.language(_this.context.language());
            });
        };
        return LanguageSelectorModel;
    }(visto.ViewModel));
    exports.LanguageSelectorModel = LanguageSelectorModel;
});
//# sourceMappingURL=LanguageSelectorModel.js.map