function pos_pay_sale_order_widgets(instance, module) {
    var QWeb = instance.web.qweb;
    var _t = instance.web._t;
    
    module.PosWidget = module.PosWidget.extend({
        build_widgets: function () {
            this._super();
            this.pay_sale_order_screen = new module.sale_orderScreenWidget(this, {});
            this.screen_selector.screen_set.pay_sale_order = this.pay_sale_order_screen;
            this.pay_sale_order_screen.appendTo(this.$('.screens'));
            this.pay_sale_order_screen.hide();

        },
    });
    
    module.ProductCategoriesWidget.include({
        
        init: function(parent, options) {
            this._super(parent, options);
        },
        
        renderElement: function () {
            var self = this;
            this._super();
            $('#pay_sale_order_button').click(function () {
                var currentOrder = self.pos.get('selectedOrder');
                var cid = currentOrder.get_client() ? currentOrder.get_client().id : 0;
                if (cid != null && cid != 0) {
                    self.pos_widget.screen_selector.set_current_screen('pay_sale_order');
                } else {
                    self.pos_widget.screen_selector.show_popup('error', {
                        message: _t('You must select a customer in the order tab first !'),
                        });
                }
            });
        }
    });
    
    module.sale_orderListWidget = module.PosBaseWidget.extend({
        template: 'sale_orderListWidget',
        sale_order_list: null,

        init: function (parent, options) {
            var self = this;
            this._super(parent, options);
            this.sale_order_cache = new module.DomCache();
            
            this.click_sale_order_handler = function (e) {
                var self = this;
                window.open(window.location.origin + '/web#id=' + parseInt(this.dataset['sale_orderId']) + '&view_type=form&model=sale.order', '_blank');
                return new instance.web.Model('sale.order').query(['id','partner_id','name','date_order','user_id','amount_total','amount_untaxed']).filter([['id', '=', parseInt(this.dataset['sale_orderId'])]]).context(null).all().then(function(sale_orders) {
                    options.click_sale_order_action(_t('POS Sale Order Paiment') + ' (' + sale_orders[0].name + ')', (sale_orders[0].amount_total * 0.5));
                    options.hide_fct();
                 });
             };
        },

        start: function () {
            var self = this;
        },
        
        show: function(sale_order_list) {
            this.sale_order_list = sale_order_list;
            this.renderElement();
        },
        
        render_sale_order: function (sale_order) {
            sale_order.amount_total = Math.round(sale_order.amount_total*100)/100
            var cached = this.sale_order_cache.get_node(sale_order.id);
            if (!cached) {
                var sale_order_html = QWeb.render('sale_order', {
                    widget: this,
                    sale_order: sale_order,
                });
                var sale_order_node = $(sale_order_html);
                this.sale_order_cache.cache_node(sale_order.id, sale_order_node);
                return sale_order_node;
            }
            return cached;
        },

        renderElement: function () {
            var self = this;
            this._super();
            var template = openerp.qweb.render(this.template, {widget: this});
            var list_container = $(template).find('.sale-order-list table tbody');
            for (var i = 0, len = this.sale_order_list.length; i < len; i++) {
                var sale_order_node = this.render_sale_order(this.sale_order_list[i]);
                $(sale_order_node).unbind('click').click(self.click_sale_order_handler);
                $(list_container).append(sale_order_node);
            }
            $(this.el).find('.sale-order-list table tbody').replaceWith($(list_container))
            
        }
    });
}