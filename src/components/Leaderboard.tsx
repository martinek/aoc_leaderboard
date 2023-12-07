"use client";

import cx from "classnames";
import differenceInSeconds from "date-fns/differenceInSeconds";
import format from "date-fns/format";
import orderBy from "lodash/orderBy";
import * as React from "react";
import useData, { LeaderboardDayStats } from "../hooks/useData";

const formatTime = (date: Date) => format(date, "HH:mm:ss");
const formatDateTime = (date: Date) => format(date, "d.LL.yyyy HH:mm:ss");

const Leaderboard: React.FC = () => {
  const [sortDay, setSortDay] = React.useState<number | undefined>(undefined);
  const { data, error, loading, refetch } = useData();

  const members = React.useMemo(() => {
    if (data == null) return [];

    if (sortDay === undefined) {
      return orderBy(data.members, [(m) => m.localScore], ["desc"]);
    } else {
      const day = sortDay.toString();
      return orderBy(
        data.members,
        [
          (m) => m.completionDayLevel[day]?.["2"]?.getStartTs ?? Infinity,
          (m) => m.completionDayLevel[day]?.["1"].getStartTs ?? Infinity,
          (m) => m.localScore,
        ],
        ["asc", "asc", "desc"]
      );
    }
  }, [data, sortDay]);

  const days = new Array(new Date().getDate()).fill(1).map((_, i) => i + 1);

  const firsts = days.map((n) => {
    const day = n.toString();
    return Math.min(
      ...members.map((m) => m.completionDayLevel[day]?.[2]?.getStartTs.getTime() ?? Infinity).filter(Boolean)
    );
  });

  return (
    <div className="w-screen h-screen flex items-center justify-center">
      <div>
        <div className="flex justify-between text-sm mb-4">
          <div>
            {loading && <div className="text-white">Loading...</div>}
            {error && <div className="text-red-600">{error.message}</div>}
          </div>
          <div className="text-right">
            <span>Last fetched: {data?.fetchedAt ? formatDateTime(new Date(data.fetchedAt)) : ""}</span>
            <br />
            <UpdateButton fetchedAt={data?.fetchedAt} onClick={() => refetch(true)} />
          </div>
        </div>

        <table cellPadding={0} cellSpacing={0}>
          <thead>
            <tr className="text-white text-sm">
              <td>Name</td>
              <td className="text-right px-2">Score</td>
              {days.map((n) => (
                <td
                  key={n}
                  className={cx("cursor-pointer text-center hover:underline", { "font-bold": sortDay === n })}
                  onClick={() => setSortDay(sortDay === n ? undefined : n)}
                >
                  #{n}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td className="pr-2">{member.name}</td>
                <td className="text-right px-2">{member.localScore}</td>
                {days.map((n) => (
                  <td key={n} className="text-center px-2">
                    <LeaderboardCell stats={member.completionDayLevel[n]} first={firsts[n - 1]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const LeaderboardCell: React.FC<{ stats: LeaderboardDayStats | null; first: number }> = ({ stats, first }) => {
  if (stats == null) return <span className="text-gray-700">*</span>;

  const bold = stats["2"]?.getStartTs.getTime() === first;

  return (
    <div className={cx("text-xs py-1", { "font-bold": bold })}>
      <span className="text-silver" title={formatDateTime(stats["1"].getStartTs)}>
        * {formatTime(stats["1"].getStartTs)}
      </span>
      <br />
      {stats["2"] != null ? (
        <span className="text-gold" title={formatDateTime(stats["2"].getStartTs)}>
          * {formatTime(stats["2"].getStartTs)}
        </span>
      ) : (
        <span className="text-gray-700">* --:--:--</span>
      )}
    </div>
  );
};

const TIMEOUT = Number(process.env.LEADERBOARD_TIMEOUT ?? 900) * 1000;

const UpdateButton: React.FC<{ fetchedAt?: number; onClick: () => void }> = ({ fetchedAt, onClick }) => {
  const [enabled, setEnabled] = React.useState(true);
  const [text, setText] = React.useState("Update");

  React.useEffect(() => {
    const enable = () => {
      setEnabled(true);
      setText("Update");
    };

    if (fetchedAt == null) {
      enable();
      return;
    }

    const now = new Date();
    const nextUpdateAt = new Date(fetchedAt + TIMEOUT);
    const updateTimeout = now.getTime() - nextUpdateAt.getTime();
    const canUpdate = updateTimeout == null || updateTimeout > 0;

    if (canUpdate) {
      enable();
      return;
    }

    const tick = () => {
      const remainingTime = differenceInSeconds(nextUpdateAt, new Date());

      if (remainingTime <= 0) {
        enable();
        return;
      }

      const hours = Math.floor(remainingTime / 3600);
      const minutes = Math.floor((remainingTime % 3600) / 60);
      const seconds = remainingTime % 60;
      const formattedTime = format(new Date(0, 0, 0, hours, minutes, seconds), "HH:mm:ss");

      setEnabled(false);
      setText(`Next update in ${formattedTime}`);
    };

    tick();
    const intval = setInterval(tick, 1000);

    return () => clearInterval(intval);
  }, [fetchedAt, enabled]);

  if (!enabled) {
    return <span>{text}</span>;
  }

  return (
    <button className="text-[#009900] hover:text-[#99ff99]" onClick={onClick}>
      {text}
    </button>
  );
};

export default Leaderboard;
