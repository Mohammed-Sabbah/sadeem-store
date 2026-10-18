import React from 'react';
import { IconEye, IconEyeOff, IconAlertTriangle, IconTrash } from './ProductStudioIcons';

interface ProductStudioSettingsTabProps {
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  isAnonymousVendor: boolean;
  setIsAnonymousVendor: (val: boolean) => void;
  handleDeleteProduct: () => void;
}

export function ProductStudioSettingsTab({
  isActive,
  setIsActive,
  isAnonymousVendor,
  setIsAnonymousVendor,
  handleDeleteProduct,
}: ProductStudioSettingsTabProps) {
  return (
    <div className="space-y-6 animate-fadeIn w-full font-almarai text-right">
      {/* 1. Storefront Visibility & Live State */}
      <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-brand-border/40">
          <span className="w-8 h-8 rounded-xl bg-brand-surface border border-brand-border/70 flex items-center justify-center text-brand-dark">
            <IconEye className="w-4 h-4 text-brand-primary" />
          </span>
          <div>
            <h2 className="text-sm font-black text-brand-dark">حالة العرض في متجر سَدِيم</h2>
            <p className="text-[11px] text-brand-muted mt-0.5">
              تحكم فوري في ظهور الصنف للزبائن في المحافظة الوسطى
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isActive ? 'bg-brand-trust shadow-xs animate-pulse' : 'bg-brand-muted/60'
                }`}
              />
              <span className="text-xs font-black text-brand-dark">
                {isActive ? 'الصنف معروض ونشط بالمتجر' : 'الصنف مخفي مؤقتاً عن الزبائن'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isActive
                    ? 'bg-brand-trust-soft text-brand-trust border-brand-trust/30'
                    : 'bg-brand-card text-brand-muted border-brand-border/70'
                }`}
              >
                {isActive ? 'متاح للطلب' : 'مسودة غير معروضة'}
              </span>
            </div>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              {isActive
                ? 'الصنف ظاهر لزبائن دير البلح والنصيرات ومتاح للإضافة للسلة الموحدة والمعاينة عند الباب.'
                : 'الصنف محجوب تماماً عن واجهة المتجر دون حذف بياناته أو كميات مخزونه. يمكنك إعادة تنشيطه بأي وقت.'}
            </p>
          </div>

          {/* iOS-Style Tactile Toggle Switch */}
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-start sm:self-center ${
              isActive ? 'bg-brand-trust' : 'bg-brand-border'
            }`}
            role="switch"
            aria-checked={isActive}
            title={isActive ? 'تعطيل وإخفاء الصنف' : 'تفعيل وإظهار الصنف'}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isActive ? '-translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* 2. Anonymous / White-label Vendor Supply */}
      <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-brand-border/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-brand-border/40">
          <span className="w-8 h-8 rounded-xl bg-brand-surface border border-brand-border/70 flex items-center justify-center text-brand-dark">
            <IconEyeOff className="w-4 h-4 text-brand-primary" />
          </span>
          <div>
            <h2 className="text-sm font-black text-brand-dark">
              عرض الصنف كجهة مجهولة / إخفاء هوية المتجر
            </h2>
            <p className="text-[11px] text-brand-muted mt-0.5">
              توريد الصنف كمنتج مباشر من سَدِيم دون الكشف عن اسم أو بيانات متجرك للزبائن
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-brand-surface/40 border border-brand-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  isAnonymousVendor ? 'bg-brand-primary shadow-xs animate-pulse' : 'bg-brand-muted/60'
                }`}
              />
              <span className="text-xs font-black text-brand-dark">
                {isAnonymousVendor
                  ? 'توريد مباشر من سَدِيم (هوية المتجر مخفية بالكامل)'
                  : 'عرض اعتيادي (مرتبط باسم متجرك المعتمد)'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isAnonymousVendor
                    ? 'bg-brand-primary-soft text-brand-primary border-brand-primary-border'
                    : 'bg-brand-card text-brand-muted border-brand-border/70'
                }`}
              >
                {isAnonymousVendor ? 'مفعل' : 'معطل'}
              </span>
            </div>
            <p className="text-[11px] text-brand-muted leading-relaxed">
              عند تفعيل هذا الخيار:
              <span className="block mt-1 font-bold text-brand-dark">
                1. يُحجب الصنف نهائياً من الظهور في صفحة متجرك العام للزبائن.
              </span>
              <span className="block mt-0.5 font-bold text-brand-dark">
                2. في صفحة تفاصيل المنتج (PDP)، يُخفى اسم وشعار متجرك ويُعرض كـ «توريد مباشر وموثق عبر سَدِيم» مع بقاء أرباحك ومستحقاتك محفوظة لك بالكامل.
              </span>
            </p>
          </div>

          {/* iOS-Style Tactile Toggle Switch */}
          <button
            type="button"
            onClick={() => setIsAnonymousVendor(!isAnonymousVendor)}
            className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none self-start sm:self-center ${
              isAnonymousVendor ? 'bg-brand-primary' : 'bg-brand-border'
            }`}
            role="switch"
            aria-checked={isAnonymousVendor}
            title={isAnonymousVendor ? 'إلغاء وضع التوريد المجهول' : 'تفعيل إخفاء هوية المتجر'}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isAnonymousVendor ? '-translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isAnonymousVendor && (
          <div className="p-3.5 rounded-xl bg-brand-primary-soft/60 border border-brand-primary-border/80 flex items-center gap-2.5 text-xs text-brand-dark animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-brand-primary shrink-0" />
            <span className="font-extrabold text-brand-dark">حالة التوريد:</span>
            <span className="text-brand-muted text-[11px]">
              الصنف محمي؛ لن يظهر في صفحة متجرك، والزبون يراه في المتجر العام كمنتج مورد مباشرة عبر سَدِيم المركزي.
            </span>
          </div>
        )}
      </div>

      {/* 3. Sensitive Danger Zone */}
      <div className="bg-brand-card rounded-2xl p-5 sm:p-7 border border-red-200/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-red-100">
          <span className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <IconAlertTriangle className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-black text-red-800">الإجراءات الحساسة وحذف الصنف</h2>
            <p className="text-[11px] text-red-700/70 mt-0.5">
              إزالة الصنف نهائياً من قاعدة بيانات المتجر
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-50/40 border border-red-100">
          <p className="text-xs text-brand-muted leading-relaxed flex-1">
            عند حذف هذا الصنف، سيتم إزالته من المتجر نهائياً. في حال ارتباطه بطلبات سابقة تم تسليمها، ستحتفظ سجلات سَدِيم بالفواتير التاريخية لضمان حقوق الزبائن والمستحقات المالية.
          </p>
          <button
            type="button"
            onClick={handleDeleteProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-red-700 bg-white hover:bg-red-50 border border-red-200 shadow-2xs hover:border-red-300 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <IconTrash className="w-3.5 h-3.5 text-red-600" />
            <span>حذف الصنف من المتجر</span>
          </button>
        </div>
      </div>
    </div>
  );
}
