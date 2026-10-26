import React from 'react';
import { Card } from '@/ui/component/NewUserImport';
import rabbyLogo from '@/ui/assets/unlock/rabby.svg';
import { Button } from 'antd';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LangSelector } from '@/ui/component/LangSelector';

export const Guide = () => {
  const { t } = useTranslation();
  const history = useHistory();

  const gotoCreate = React.useCallback(() => {
    history.push('/new-user/create-seed-phrase');
  }, []);

  const gotoImport = React.useCallback(() => {
    history.push('/new-user/import-wallet-type');
  }, []);

  return (
    <div className="crabble-atmosphere h-full relative flex items-center justify-center">
      <div className="fixed top-[40px] right-[40px] z-10">
        <LangSelector />
      </div>
      <div className="relative z-10">
        <div className="flex flex-col items-center">
          <img
            src={rabbyLogo}
            className="crabble-brand-tile w-[96px] h-[96px]"
          />
          <div className="mt-24 mb-8 text-[28px] leading-[34px] font-semibold tracking-[-0.02em] text-r-neutral-title1">
            {t('page.newUserImport.guide.title')}
          </div>
          <div className="text-14 font-normal text-r-neutral-foot text-center">
            {t('page.newUserImport.guide.desc')}
          </div>

          <Button
            onClick={gotoCreate}
            block
            type="primary"
            className={clsx(
              'mt-[40px] mb-16 w-[360px]',
              'h-[56px] shadow-none rounded-[12px]',
              'text-[17px] font-medium bg-r-blue-default'
            )}
          >
            {t('page.newUserImport.guide.createNewAddress')}
          </Button>

          <Button
            onClick={gotoImport}
            block
            type="primary"
            ghost
            className={clsx(
              'h-[56px] shadow-none rounded-[12px] w-[360px]',
              'text-[17px] font-medium',
              'hover:bg-r-blue-light-2 hover:before:hidden hover:border-rabby-blue-default hover:text-r-blue-default'
            )}
          >
            {t('page.newUserImport.guide.importAddress')}
          </Button>
        </div>
      </div>
    </div>
  );
};
