import { LOCALE } from "@config";
import { IconCalendarWeek } from "@tabler/icons-react";

interface DatetimesProps {
  pubDatetime: string | Date;
  modDatetime: string | Date | undefined | null;
}

export default function Datetime({
  pubDatetime,
  modDatetime,
}: DatetimesProps) {
  return (
    <div
      className="flex items-center justify-between"
    >
      <div className="flex items-center gap-1">
        <IconCalendarWeek />
        <FormattedDatetime
          pubDatetime={pubDatetime}
          modDatetime={modDatetime}
        />
      </div>
    </div>
  );
}

const FormattedDatetime = ({ pubDatetime, modDatetime }: DatetimesProps) => {
  const myDatetime = new Date(
    modDatetime && modDatetime > pubDatetime ? modDatetime : pubDatetime
  );

  const date = myDatetime.toLocaleDateString(LOCALE.langTag, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <>
      <time dateTime={myDatetime.toISOString()} className="text-sm">{date}</time>
    </>
  );
};
