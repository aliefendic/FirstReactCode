import fruk from "../magic/fruk";

import "./App.css";

export default function App() {
  return (
    <>
      {fruk`
        [div#Main]
        :class flex flex-row
        :class content-space-between
        :class w-screen h-screen
        :class p-10 gap-5
        
          [div#Title]
          :class w-full h-16

            My application

          [div#Box-1]
          :class w-24/100 h-26/100

          [div#Box-2]
          :class w-24/100 h-26/100

          [div#Box-3]
          :class w-24/100 h-26/100

          [div#Box-4]
          :class w-24/100 h-26/100

      `}
    </>
  );
}
