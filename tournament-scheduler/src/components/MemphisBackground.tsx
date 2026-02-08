"use client";

export default function MemphisBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: -1 }}>
        {/* Circles - Mint Green */}
        <div
          className="absolute rounded-full bg-primary opacity-20"
          style={{
            width: "80px",
            height: "80px",
            top: "10%",
            left: "15%",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full bg-primary opacity-20"
          style={{
            width: "60px",
            height: "60px",
            top: "70%",
            left: "80%",
            animation: "float-slow 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full bg-primary opacity-20"
          style={{
            width: "100px",
            height: "100px",
            top: "40%",
            left: "5%",
            animation: "float-fast 5s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full bg-primary opacity-20"
          style={{
            width: "120px",
            height: "120px",
            top: "85%",
            left: "40%",
            animation: "float 7s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full bg-primary opacity-20"
          style={{
            width: "50px",
            height: "50px",
            top: "20%",
            right: "10%",
            animation: "float-slow 9s ease-in-out infinite",
          }}
        />

        {/* Triangles - Lilac Purple */}
        <div
          className="absolute opacity-20"
          style={{
            width: 0,
            height: 0,
            borderLeft: "40px solid transparent",
            borderRight: "40px solid transparent",
            borderBottom: "70px solid hsl(260, 60%, 85%)",
            top: "25%",
            left: "60%",
            animation: "float-fast 4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute opacity-20"
          style={{
            width: 0,
            height: 0,
            borderLeft: "30px solid transparent",
            borderRight: "30px solid transparent",
            borderBottom: "50px solid hsl(260, 60%, 85%)",
            top: "60%",
            left: "30%",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute opacity-20"
          style={{
            width: 0,
            height: 0,
            borderLeft: "50px solid transparent",
            borderRight: "50px solid transparent",
            borderBottom: "85px solid hsl(260, 60%, 85%)",
            top: "5%",
            left: "85%",
            animation: "float-slow 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute opacity-20"
          style={{
            width: 0,
            height: 0,
            borderLeft: "35px solid transparent",
            borderRight: "35px solid transparent",
            borderBottom: "60px solid hsl(260, 60%, 85%)",
            top: "80%",
            left: "70%",
            animation: "float-fast 5s ease-in-out infinite",
          }}
        />

        {/* Rectangles - Soft Yellow */}
        <div
          className="absolute bg-secondary opacity-20"
          style={{
            width: "80px",
            height: "50px",
            top: "15%",
            left: "40%",
            transform: "rotate(15deg)",
            animation: "float-slow 7s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bg-secondary opacity-20"
          style={{
            width: "60px",
            height: "40px",
            top: "50%",
            left: "85%",
            transform: "rotate(-20deg)",
            animation: "float 5s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bg-secondary opacity-20"
          style={{
            width: "70px",
            height: "45px",
            top: "75%",
            left: "15%",
            transform: "rotate(25deg)",
            animation: "float-fast 6s ease-in-out infinite",
          }}
        />
        <div
          className="absolute bg-secondary opacity-20"
          style={{
            width: "90px",
            height: "55px",
            top: "35%",
            right: "5%",
            transform: "rotate(-10deg)",
            animation: "float-slow 8s ease-in-out infinite",
          }}
        />

        {/* Decorative Lines - Dark Grey */}
        <div
          className="absolute opacity-15"
          style={{
            width: "120px",
            height: "4px",
            backgroundColor: "hsl(0, 0%, 30%)",
            top: "45%",
            left: "70%",
            transform: "rotate(45deg)",
            animation: "float 9s ease-in-out infinite",
          }}
        />
        <div
          className="absolute opacity-15"
          style={{
            width: "100px",
            height: "4px",
            backgroundColor: "hsl(0, 0%, 30%)",
            top: "65%",
            left: "50%",
            transform: "rotate(-30deg)",
            animation: "float-slow 7s ease-in-out infinite",
          }}
        />
      </div>
  );
}
