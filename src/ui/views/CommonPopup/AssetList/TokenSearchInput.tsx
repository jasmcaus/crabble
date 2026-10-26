import { ReactComponent as SearchSVG } from '@/ui/assets/search.svg';
import { useCommonPopupView } from '@/ui/utils';
import { Input, InputRef } from 'antd';
import clsx from 'clsx';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from 'react-use';
import styled from 'styled-components';

export interface Props {
  onSearch?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  className?: string;
  placeholder?: string;
}

const InputStyled = styled(Input)`
  background-color: var(--crb-sunken, #f4f4f5) !important;
  border-color: transparent !important;
  box-shadow: none !important;
  transition: background-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    background-color: var(--crb-sunken-hover, #ececef) !important;
  }
  &.ant-input-affix-wrapper-focused {
    background-color: var(--crb-raised, #fff) !important;
    border-color: var(--r-blue-default, #e8552a) !important;
    box-shadow: var(--crb-ring) !important;
  }

  .ant-input {
    background: transparent !important;
    font-size: 13px;
  }

  .ant-input-prefix {
    margin-right: 6px;
    color: var(--r-neutral-foot);
  }

  input::placeholder {
    font-size: 13px;
    color: var(--r-neutral-foot, #71717a);
  }
`;

export const TokenSearchInput = React.forwardRef<InputRef, Props>(
  ({ onSearch, onBlur, onFocus, className, placeholder }, ref) => {
    const [input, setInput] = React.useState<string>('');
    const { visible } = useCommonPopupView();
    const { t } = useTranslation();

    React.useEffect(() => {
      if (!visible) {
        setInput('');
      }
    }, [visible]);

    useDebounce(
      () => {
        onSearch?.(input);
      },
      300,
      [input]
    );

    return (
      <InputStyled
        ref={ref}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          placeholder || t('page.dashboard.assets.searchPlaceholder')
        }
        onFocus={onFocus}
        onBlur={onBlur}
        allowClear
        className={clsx(
          'text-[13px] text-r-neutral-title1 py-0 px-[10px] h-[34px]',
          'rounded-[10px]',
          'transform-none',
          className
        )}
        prefix={<SearchSVG className="w-[14px] h-[14px]" />}
      />
    );
  }
);
