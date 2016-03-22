function pos_pay_sale_order_screens(instance, module) { //module is instance.point_of_sale

    var QWeb = instance.web.qweb,
        _t = instance.web._t,
        round_pr = instance.web.round_precision;
    
    module.sale_orderScreenWidget = module.ScreenWidget.extend({
        template: 'sale_orderScreenWidget',

        show_numpad: true,
        show_leftpane: true,

        sale_order_list_widget: null,

        start: function () {
            var self = this;
            this.sale_order_list_widget = new module.sale_orderListWidget(this, {
                click_sale_order_action: function(message, amount){
                    self.pos_widget.cash_deposit_popup.create_cash_deposit(message, amount);
                },
                hide_fct: function() {
                    self.pos_widget.screen_selector.set_current_screen('products');
                },
            });
            
        },
        
        fetch : function(model, fields, domain, ctx) {
            return new instance.web.Model(model).query(fields).filter(domain).context(ctx).all()
        },
        
        show: function () {
            this._super();
            var self = this;
            this.$el.find('.close-sale_order').off('click').click(function () {
                self.hide_sale_order_screen();
            });
            var currentOrder = self.pos.get('selectedOrder');
            var client_id = currentOrder.get_client().id;
            var sale_orders_list = self.fetch('sale.order',['id','partner_id','name','date_order','user_id','amount_untaxed','amount_total','residual','origin'], [['partner_id.id', '=', client_id],['state', 'in', ['draft', 'sent']]]).then(function(sale_orders) {
                var sale_orders_list = [];
                for (var i = 0, len = sale_orders.length; i < len; i++) {
                    sale_orders_list.push(sale_orders[i]);
                }
                self.sale_order_list_widget.show(sale_orders_list);
                self.sale_order_list_widget.replace($('.placeholder-sale_orderListWidget'));
            }, function (err, event) {
                event.preventDefault();
                self.pos_widget.screen_selector.show_popup('error',{
                    message: _t('Impossible to load the list of quotation'),
                    comment: _t('Check your internet connection and try again.'),
                });
            });
            
        },

        hide_sale_order_screen: function () {
            var self = this;
            self.pos_widget.screen_selector.set_current_screen('products');

        },
    });
}