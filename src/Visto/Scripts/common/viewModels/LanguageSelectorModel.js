var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
define(["require", "exports", "libs/visto"], function (require, exports, visto) {
    var LanguageSelectorModel = (function (_super) {
        __extends(LanguageSelectorModel, _super);
        function LanguageSelectorModel() {
            _super.apply(this, arguments);
            this.language = ko.observable(visto.language());
            this.supportedLanguages = visto.supportedLanguages;
        }
        LanguageSelectorModel.prototype.initialize = function () {
            var _this = this;
            this.subscribe(this.language, function () {
                visto.setLanguage(_this.language(), _this.supportedLanguages);
            });
            this.subscribe(visto.language, function () {
                _this.language(visto.language());
            });
        };
        return LanguageSelectorModel;
    })(visto.ViewModel);
    exports.LanguageSelectorModel = LanguageSelectorModel;
});
//# sourceMappingURL=LanguageSelectorModel.js.map