import visto = require("libs/visto");
import common = require("common/main");

common.registerTagAliases();

visto.initialize(<visto.IVistoOptions>{
    startView: "MainView",
    supportedLanguages: ["en", "de"]
}).done();