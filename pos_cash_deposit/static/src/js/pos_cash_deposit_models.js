function pos_cash_deposit_models(instance, module) { //module is instance.point_of_sale
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;

    var _super_initialize = module.Orderline.prototype.initialize;
    var _super_export_as_JSON = module.Orderline.prototype.export_as_JSON;
    var _super_addProduct = module.Order.prototype.addProduct;

    module.Orderline.prototype.export_as_JSON = function () {
        res = _super_export_as_JSON.call(this);
        res.notice = this.notice;
        return res;
    };

    module.Orderline.prototype.initialize = function (attr, options) {
        this.notice = options.notice;
        _super_initialize.call(this, attr, options);
    };
}