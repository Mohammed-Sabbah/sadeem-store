'use client';

import React, { useState, useMemo } from 'react';
import {
  useAdminCategoriesQuery,
  useAdminCategoryMutations,
} from '@/features/admin/queries/useAdminQueries';
import { AdminCategoryGrid } from '@/features/admin/components/AdminCategoryGrid';
import { AdminCategoryModal } from '@/features/admin/components/AdminCategoryModal';
import { AdminCategoryDeleteModal } from '@/features/admin/components/AdminCategoryDeleteModal';

export default function AdminCategoriesPage() {
  const { data: categories = [], isLoading } = useAdminCategoriesQuery();
  const {
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useAdminCategoryMutations();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; title: string } | null>(null);

  const filteredCategories = useMemo(() => {
    return categories.filter((c: any) => {
      const matchQuery =
        !searchQuery ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.slug?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;

      const isActive = c.isActive !== false;
      if (filterActive === 'active' && !isActive) return false;
      if (filterActive === 'inactive' && isActive) return false;

      return true;
    });
  }, [categories, searchQuery, filterActive]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: any) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (data: {
    title: string;
    variantAttributes: Array<{ name: string; key: string; type: string }>;
  }) => {
    if (editingCategory) {
      updateCategory(
        {
          id: editingCategory._id,
          data,
        },
        {
          onSettled: () => {
            setIsModalOpen(false);
            setEditingCategory(null);
          },
        }
      );
    } else {
      createCategory(data, {
        onSettled: () => {
          setIsModalOpen(false);
        },
      });
    }
  };

  const handleToggleActive = (category: any) => {
    const currentActive = category.isActive !== false;
    updateCategory({
      id: category._id,
      data: {
        isActive: !currentActive,
      },
    });
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategory(categoryToDelete.id, {
        onSettled: () => setCategoryToDelete(null),
      });
    }
  };

  const isBusy = isCreating || isUpdating || isDeleting;

  return (
    <div className="space-y-6 font-almarai text-right">
      {/* 1. Header Mission & Add Action */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-6 sm:p-7 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-black text-brand-dark tracking-tight">
              إدارة الفئات والتصنيفات
            </h2>
            <p className="text-xs text-brand-muted max-w-xl leading-relaxed">
              هيكلة وتنظيم شجرة التصنيفات المعتمدة في منصة سَدِيم وإدارة خصائص المتغيرات (المقاسات، الأوزان، الأحجام) المتاحة للتجار.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-brand-primary text-white text-xs font-black hover:bg-brand-primary-hover active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            + إضافة فئة جديدة
          </button>
        </div>
      </div>

      {/* 2. Search & Filter Strip */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-4 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الفئة أو الرابط المختصر..."
            className="w-full h-10 pr-9 pl-4 text-xs font-medium rounded-xl border border-brand-border bg-brand-surface text-brand-dark placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
          />
          <svg
            className="w-4 h-4 text-brand-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto text-xs">
          <button
            type="button"
            onClick={() => setFilterActive('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterActive === 'all'
                ? 'bg-brand-dark text-white'
                : 'bg-brand-surface text-brand-muted hover:text-brand-dark'
            }`}
          >
            الكل ({categories.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive('active')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterActive === 'active'
                ? 'bg-brand-dark text-white'
                : 'bg-brand-surface text-brand-muted hover:text-brand-dark'
            }`}
          >
            نشطة
          </button>
          <button
            type="button"
            onClick={() => setFilterActive('inactive')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterActive === 'inactive'
                ? 'bg-brand-dark text-white'
                : 'bg-brand-surface text-brand-muted hover:text-brand-dark'
            }`}
          >
            معطلة
          </button>
        </div>
      </div>

      {/* 3. Categories Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-brand-muted">جارٍ تحميل الفئات والتصنيفات...</p>
        </div>
      ) : (
        <AdminCategoryGrid
          categories={filteredCategories}
          onEdit={handleOpenEdit}
          onDelete={(id, title) => setCategoryToDelete({ id, title })}
          onToggleActive={handleToggleActive}
          isBusy={isBusy}
        />
      )}

      {/* 4. Add/Edit Category Modal */}
      <AdminCategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleModalSubmit}
        initialCategory={editingCategory}
        isSubmitting={isCreating || isUpdating}
      />

      {/* 5. Delete Confirm Modal */}
      <AdminCategoryDeleteModal
        isOpen={Boolean(categoryToDelete)}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleConfirmDelete}
        categoryTitle={categoryToDelete?.title || ''}
        isDeleting={isDeleting}
      />
    </div>
  );
}
