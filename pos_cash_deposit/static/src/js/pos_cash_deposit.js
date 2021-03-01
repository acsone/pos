openerp.pos_cash_deposit = function (instance) {
    var module = instance.point_of_sale;
    pos_cash_deposit_models(instance, module);
    pos_cash_deposit_db(instance, module);
    pos_cash_deposit_widgets(instance, module);
    pos_cash_deposit_screens(instance, module);
};