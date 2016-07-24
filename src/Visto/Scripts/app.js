define(["require", "exports", "libs/visto", "common/main"], function (require, exports, visto, common) {
    "use strict";
    common.registerTagAliases();
    visto.initialize({
        startView: "MainView",
        supportedLanguages: ["en", "de"]
    }).done();
});
//# sourceMappingURL=app.js.map