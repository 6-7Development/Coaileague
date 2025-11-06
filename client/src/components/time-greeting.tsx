import { useEffect, useState } from "react";

interface TimeGreetingProps {
  userName?: string;
  role?: string;
  className?: string;
}

export function TimeGreeting({ userName, role, className }: TimeGreetingProps) {
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) {
        setGreeting("Good morning");
      } else if (hour < 18) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    };

    updateGreeting();
    const interval = setInterval(updateGreeting, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <p className={className} data-testid="text-greeting">
      {greeting}
      {userName && `, ${userName}`}
      {role && <span className="opacity-80"> · {role}</span>}
    </p>
  );
}
