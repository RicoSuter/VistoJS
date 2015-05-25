define(["require", "exports"], function (require, exports) {
    function getItems() {
        return Q.Promise(function (resolve) {
            setTimeout(function () {
                resolve([
                    { id: 1, title: "Item 1" },
                    { id: 2, title: "Item 2" },
                    { id: 3, title: "Item 3" }
                ]);
            }, 1000);
        });
    }
    exports.getItems = getItems;
});
//# sourceMappingURL=SampleService.js.map