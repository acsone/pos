function pos_cash_deposit_db(instance, module) { //module is instance.point_of_sale
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;
    
    module.PosDB = module.PosDB.extend({
        init: function (options) {
            options = options || {};
            this._super(options);
            var self = this
            this.cash_deposit_id = false;
            this.cash_deposit_product = false;
            new instance.web.Model('ir.model.data').call('get_object_reference', [ 'pos_cash_deposit', 'pos_cash_deposit_product' ]).then(function (ids) {
                self.cash_deposit_id = ids[1]
                return new instance.web.Model('product.product').query([ 'name', 'list_price', 'price',
                     'pos_categ_id', 'taxes_id', 'ean13', 'default_code', 'variants', 'to_weight', 'uom_id',
                     'uos_id', 'uos_coeff', 'mes_type', 'description_sale', 'description', 'product_tmpl_id',
                     'active' ]).filter([
                     [ 'id', '=', self.cash_deposit_id ],
                     [ 'active', '>=', 0 ]
                 ]).context(null).all().then(function (products) {
                     self.cash_deposit_product = products[0]
                }, function (err, event) {
                     event.preventDefault();
                });
            },function (err, event) {
                event.preventDefault();
            });
        },
    });
}