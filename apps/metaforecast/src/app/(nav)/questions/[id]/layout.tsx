import { PropsWithChildren } from 'react';

import { Card } from '@/web/common/Card';

export default function ({ children }: PropsWithChildren) {
  return (
    <div className="max-w-4xl mx-auto">
      <Card highlightOnHover={false} large>
        {children}
      </Card>
    </div>
  );
}
