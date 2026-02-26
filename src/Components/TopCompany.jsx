import React, { useState } from "react";
import { Button } from "flowbite-react";
import Rating from "@mui/material/Rating";
import Stack from "@mui/material/Stack";
import StarIcon from "@mui/icons-material/Star";
import Box from "@mui/material/Box";

const ListCompany = React.memo(({ rank }) => {
  const [value, setValue] = useState(2.5);
  const [hover, setHover] = useState(-1);

  return (
    <div className="bg-white border border-black rounded-2xl p-2.5 mt-4 w-120 group">
      <div className="flex items-center space-x-3">
        <div className="text-sm font-black text-gray-300 pl-4 w-12">{rank}</div>
        <div className="w-10 h-10 rounded-full border-2 border-black bg-gray-300 ml-2.5 mr-4 shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-gray-800 group-hover:text-[#9346F5] transition-colors truncate">
            Công ty TNHH Sorimachi VN
          </div>
          <div className="flex text-[11px] items-center space-x-2 mt-0.5">
            <div className="font-semibold text-gray-500">Review</div>
            <Stack spacing={1} direction="row" alignItems="center">
              <Rating
                size="small"
                name="hover-feedback"
                value={value}
                precision={0.1}
                onChange={(event, newValue) => {
                  setValue(newValue);
                }}
                onChangeActive={(event, newHover) => {
                  setHover(newHover);
                }}
                emptyIcon={
                  <StarIcon style={{ opacity: 0.55 }} fontSize="inherit" />
                }
              />
              {value !== null && (
                <Box
                  sx={{ ml: 2 }}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  className="font-bold text-gray-600"
                >
                  {hover !== -1 ? hover : value}
                  <StarIcon
                    className="ml-0.5"
                    style={{ color: "#e8b525" }}
                    sx={{ fontSize: "16px" }}
                  />
                </Box>
              )}
            </Stack>
            <div className="font-semibold text-gray-400">(2520 đánh giá)</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function TopCompany() {
  const [active, setActive] = useState("t1");

  return (
    <div className="w-full bg-[#E8DEF5] border border-gray-300 rounded-3xl p-5 shadow-sm">
      <div className="font-bold text-lg text-gray-900 tracking-tight pl-3">
        Top Công ty / Doanh nghiệp tiêu biểu
      </div>
      <div className="pl-13 pt-2 pb-5">
        <div className="flex mt-3">
          <Button
            color="light"
            size="xs"
            className={`pill mr-3 shadow-none transition-all ${
              active === "t1"
                ? "bg-linear-to-r from-[#E49AF6] to-[#CBA3FF] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActive("t1")}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider px-2">
              Theo lượt đánh giá
            </span>
          </Button>
          <Button
            color="light"
            size="xs"
            className={`pill mr-3 shadow-none transition-all ${
              active === "t2"
                ? "bg-linear-to-r from-[#E49AF6] to-[#CBA3FF] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActive("t2")}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider px-2">
              Theo số lượng sử dụng
            </span>
          </Button>
          <Button
            color="light"
            size="xs"
            className={`pill shadow-none transition-all ${
              active === "t3"
                ? "bg-linear-to-r from-[#E49AF6] to-[#CBA3FF] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
            onClick={() => setActive("t3")}
          >
            <span className="text-[9px] font-bold uppercase tracking-wider px-2">
              Mới được cập nhật
            </span>
          </Button>
        </div>

        {[
          "1st",
          "2nd",
          "3rd",
          "4th",
          "5th",
          "6th",
          "7th",
          "8th",
          "9th",
          "10th",
        ].map((rank) => (
          <ListCompany key={rank} rank={rank} />
        ))}
      </div>
    </div>
  );
}
