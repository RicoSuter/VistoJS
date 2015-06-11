define(["require", "exports"], function (require, exports) {
    function getItems() {
        return Q.delay(1000).then(function () {
            return [
                { id: 1, title: "Item 1" },
                { id: 2, title: "Item 2" },
                { id: 3, title: "Item 3" }
            ];
        });
    }
    exports.getItems = getItems;
});
//# sourceMappingURL=SampleService.js.map