'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  useAdminCategoriesQuery,
  useAdminCategoryMutations,
} from '@/features/admin/queries/useAdminQueries';
import { AdminCategoryGrid } from '@/features/admin/components/AdminCategoryGrid';
import { AdminCategoryTable } from '@/features/admin/components/AdminCategoryTable';
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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sadeem_category_view_mode');
      if (saved === 'table' || saved === 'grid') {
        setViewMode(saved);
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, []);

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode);
    try {
      localStorage.setItem('sadeem_category_view_mode', mode);
    } catch {
      // Ignore localStorage errors
    }
  };

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
    variantAttributes: Array<{ name: string; key: string; type: string; values: string[] }>;
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

      {/* 2. Search, Filter & View Toggle Strip */}
      <div className="bg-brand-card rounded-2xl border border-brand-border p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 text-xs">
          {/* Active status filter */}
          <div className="flex items-center gap-1">
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

          <div className="h-5 w-px bg-brand-border hidden sm:block mx-1" />

          {/* View Mode Toggle (Grid vs Table) */}
          <div className="flex items-center gap-1 p-1 bg-brand-surface rounded-xl border border-brand-border">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-brand-card text-brand-dark shadow-2xs'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
              title="عرض شبكة البطاقات"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>بطاقات</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-brand-card text-brand-dark shadow-2xs'
                  : 'text-brand-muted hover:text-brand-dark'
              }`}
              title="عرض الجدول المضغوط"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span>جدول</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Categories Content (Table vs Grid) */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-brand-muted">جارٍ تحميل الفئات والتصنيفات...</p>
        </div>
      ) : viewMode === 'table' ? (
        <AdminCategoryTable
          categories={filteredCategories}
          onEdit={handleOpenEdit}
          onDelete={(id, title) => setCategoryToDelete({ id, title })}
          onToggleActive={handleToggleActive}
          isBusy={isBusy}
        />
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
