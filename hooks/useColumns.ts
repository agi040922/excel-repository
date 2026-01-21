import { useState } from 'react';
import { ExcelColumn } from '@/types';

export const useColumns = () => {
  const [columns, setColumns] = useState<ExcelColumn[]>([]);
  const [newColumnName, setNewColumnName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addColumn = (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null); // 에러 초기화

    const trimmedName = newColumnName.trim();

    // 유효성 검사: 빈 값
    if (!trimmedName) {
      setError('컬럼 이름을 입력해주세요');
      return;
    }

    // 유효성 검사: 길이 제한
    if (trimmedName.length > 50) {
      setError('컬럼 이름은 50자를 초과할 수 없습니다');
      return;
    }

    // 유효성 검사: 중복 체크
    if (columns.some(col => col.header.toLowerCase() === trimmedName.toLowerCase())) {
      setError('이미 존재하는 컬럼 이름입니다');
      return;
    }

    // 유효성 검사: 특수문자 제한 (선택적)
    const invalidChars = /[<>:"\/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      setError('컬럼 이름에 특수문자(<>:"/\\|?*)는 사용할 수 없습니다');
      return;
    }

    // 모든 검사 통과 - 컬럼 추가
    setColumns([...columns, {
      header: trimmedName,
      key: trimmedName.toLowerCase().replace(/\s/g, '_')
    }]);
    setNewColumnName('');
  };

  const updateColumnName = (index: number, newName: string) => {
    setError(null); // 에러 초기화

    const trimmedName = newName.trim();

    // 유효성 검사: 빈 값
    if (!trimmedName) {
      setError('컬럼 이름을 입력해주세요');
      return;
    }

    // 유효성 검사: 길이 제한
    if (trimmedName.length > 50) {
      setError('컬럼 이름은 50자를 초과할 수 없습니다');
      return;
    }

    // 유효성 검사: 중복 체크 (자기 자신 제외)
    if (columns.some((col, i) => i !== index && col.header.toLowerCase() === trimmedName.toLowerCase())) {
      setError('이미 존재하는 컬럼 이름입니다');
      return;
    }

    // 유효성 검사: 특수문자 제한
    const invalidChars = /[<>:"\/\\|?*]/;
    if (invalidChars.test(trimmedName)) {
      setError('컬럼 이름에 특수문자(<>:"/\\|?*)는 사용할 수 없습니다');
      return;
    }

    // 모든 검사 통과 - 컬럼 업데이트
    const newColumns = [...columns];
    newColumns[index] = {
      ...newColumns[index],
      header: trimmedName,
      key: trimmedName.toLowerCase().replace(/\s/g, '_')
    };
    setColumns(newColumns);
  };

  const removeColumn = (index: number) => {
    setError(null); // 에러 초기화
    const newColumns = [...columns];
    newColumns.splice(index, 1);
    setColumns(newColumns);
  };

  // 에러 초기화 함수
  const clearError = () => {
    setError(null);
  };

  return {
    columns,
    setColumns,
    newColumnName,
    setNewColumnName,
    error,
    clearError,
    addColumn,
    updateColumnName,
    removeColumn,
  };
};
