'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ExtractionHistory {
  id: string;
  date: string;
  imageCount: number;
  status: 'completed' | 'pending' | 'error';
  exportedFileUrl: string | null;
}

interface TemplateColumn {
  header: string;
  key: string;
}

interface TemplateDetail {
  id: string;
  name: string;
  columns: TemplateColumn[];
  originalFileUrl: string | null;
  createdAt: string;
  extractions: ExtractionHistory[];
  allImageUrls: string[];
}

interface TemplateDetailModalProps {
  template: TemplateDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
}

const StatusBadge: React.FC<{ status: ExtractionHistory['status'] }> = ({ status }) => {
  const config = {
    completed: { bg: 'bg-green-100', text: 'text-green-700', label: '완료' },
    pending: { bg: 'bg-orange-100', text: 'text-orange-700', label: '진행 중' },
    error: { bg: 'bg-red-100', text: 'text-red-700', label: '오류' },
  };
  const { bg, text, label } = config[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

export function TemplateDetailModal({ template, isOpen, onClose, onDelete, onUpdate }: TemplateDetailModalProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedColumns, setEditedColumns] = useState<TemplateColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editedName, setEditedName] = useState('');

  // template이 변경되면 상태 초기화
  useEffect(() => {
    if (template) {
      setEditedColumns([...template.columns]);
      setEditedName(template.name);
      setIsEditMode(false);
      setNewColumnName('');
    }
  }, [template]);

  const handleDelete = () => {
    if (confirm('이 템플릿을 삭제하시겠습니까? 관련된 추출 이력은 유지됩니다.')) {
      onDelete?.(template!.id);
      onClose();
    }
  };

  const handleDownloadOriginal = () => {
    if (template?.originalFileUrl) {
      window.open(template.originalFileUrl, '_blank');
    }
  };

  const handleColumnNameChange = useCallback((index: number, newHeader: string) => {
    setEditedColumns(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        header: newHeader,
        key: newHeader.toLowerCase().replace(/\s/g, '_'),
      };
      return updated;
    });
  }, []);

  const handleRemoveColumn = useCallback((index: number) => {
    setEditedColumns(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleAddColumn = useCallback(() => {
    if (!newColumnName.trim()) return;
    setEditedColumns(prev => [
      ...prev,
      {
        header: newColumnName.trim(),
        key: newColumnName.trim().toLowerCase().replace(/\s/g, '_'),
      },
    ]);
    setNewColumnName('');
  }, [newColumnName]);

  const handleSave = async () => {
    if (!template || editedColumns.length === 0) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editedName,
          columns: editedColumns,
        }),
      });

      if (response.ok) {
        setIsEditMode(false);
        onUpdate?.();
        // 페이지 새로고침으로 데이터 갱신
        window.location.reload();
      } else {
        alert('템플릿 저장에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('템플릿 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (template) {
      setEditedColumns([...template.columns]);
      setEditedName(template.name);
    }
    setIsEditMode(false);
    setNewColumnName('');
  };

  // Early return if modal should not be shown
  if (!isOpen || !template) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">템플릿 상세</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-slate-500">
                <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-140px)] space-y-6">
            {/* 기본 정보 */}
            <section className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-lg font-bold text-slate-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 w-full focus:outline-none focus:ring-2 focus:ring-excel-500 focus:border-transparent"
                    />
                  ) : (
                    <h3 className="text-lg font-bold text-slate-900">{template.name}</h3>
                  )}
                  <p className="text-sm text-slate-500 mt-1">생성일: {template.createdAt}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!isEditMode && (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
                      </svg>
                      수정
                    </button>
                  )}
                  {template.originalFileUrl && (
                    <button
                      onClick={handleDownloadOriginal}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                      </svg>
                      원본 파일
                    </button>
                  )}
                </div>
              </div>

              {/* 컬럼 구조 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-500">
                    컬럼 구조 ({isEditMode ? editedColumns.length : template.columns.length}개)
                  </p>
                </div>

                {isEditMode ? (
                  <div className="space-y-2">
                    {/* 편집 가능한 컬럼 목록 */}
                    <div className="space-y-2">
                      {editedColumns.map((col, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={col.header}
                            onChange={(e) => handleColumnNameChange(idx, e.target.value)}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-excel-500 focus:border-transparent"
                          />
                          <button
                            onClick={() => handleRemoveColumn(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="컬럼 삭제"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* 새 컬럼 추가 */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <input
                        type="text"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                        placeholder="새 컬럼 이름"
                        className="flex-1 px-3 py-2 bg-white border border-dashed border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-excel-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddColumn}
                        disabled={!newColumnName.trim()}
                        className="px-3 py-2 bg-excel-600 text-white rounded-lg text-sm font-medium hover:bg-excel-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        추가
                      </button>
                    </div>

                    {/* 저장/취소 버튼 */}
                    <div className="flex items-center justify-end gap-2 pt-3">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving || editedColumns.length === 0}
                        className="px-4 py-1.5 bg-excel-600 text-white rounded-lg text-sm font-medium hover:bg-excel-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            저장 중...
                          </>
                        ) : (
                          '저장'
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {template.columns.map((col, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-200 rounded-md text-sm text-slate-700"
                      >
                        {col.header}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* 업로드된 이미지 갤러리 */}
            {template.allImageUrls.length > 0 && (
              <section>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
                    <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.219a.75.75 0 00-1.06 0l-1.91 1.909.47.47a.75.75 0 11-1.06 1.06L6.53 8.091a.75.75 0 00-1.06 0l-2.97 2.97zM12 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                  </svg>
                  업로드된 이미지 ({template.allImageUrls.length}개)
                </h4>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {template.allImageUrls.slice(0, 5).map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-200 hover:border-excel-500 transition-colors"
                    >
                      <Image
                        src={url}
                        alt={`이미지 ${idx + 1}`}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                  {template.allImageUrls.length > 5 && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-500">
                        +{template.allImageUrls.length - 5}
                      </span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 추출 이력 */}
            <section>
              <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-400">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                </svg>
                추출 이력 ({template.extractions.length}건)
              </h4>

              {template.extractions.length > 0 ? (
                <div className="space-y-2">
                  {template.extractions.map((ext) => (
                    <div
                      key={ext.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600">{ext.date}</span>
                        <span className="text-sm text-slate-500">{ext.imageCount}개 이미지</span>
                        <StatusBadge status={ext.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        {ext.status === 'completed' && ext.exportedFileUrl ? (
                          <a
                            href={ext.exportedFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-sm text-excel-700 bg-excel-50 hover:bg-excel-100 rounded-lg transition-colors"
                          >
                            다운로드
                          </a>
                        ) : ext.status === 'error' || ext.status === 'pending' ? (
                          <Link
                            href={`/extraction?id=${ext.id}`}
                            className="px-3 py-1.5 text-sm text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                          >
                            이어하기
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">아직 추출 이력이 없습니다</p>
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
            <button
              onClick={handleDelete}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              삭제
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                닫기
              </button>
              <Link
                href={`/extraction?templateId=${template.id}`}
                className="px-4 py-2 text-sm font-medium text-white bg-excel-600 hover:bg-excel-700 rounded-lg transition-colors"
              >
                새 추출 시작
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
