
import React, { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Target date: June 27, 2025 at 8:59 PM CST
    const targetDate = new Date('2025-06-27T20:59:00-06:00'); // CST is UTC-6

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds }
  ];

  return (
    <div className="flex flex-col items-center gap-6 my-12">
      <h3 className="text-2xl font-medium text-foreground sf-display">
        Launching In
      </h3>
      
      <div className="flex gap-4 md:gap-8">
        {timeUnits.map((unit, index) => (
          <div key={unit.label} className="flex flex-col items-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-xl flex items-center justify-center border border-border/40 backdrop-blur-sm">
              <span className="text-2xl md:text-3xl font-bold text-primary sf-display">
                {unit.value.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-sm text-muted-foreground mt-2 sf-text">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        Friday, June 27, 2025 at 8:59 PM CST
      </p>
    </div>
  );
};

export default CountdownTimer;
