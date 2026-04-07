import { query } from "./_generated/server";

export const getStats = query({
    args: {},
    handler: async (ctx) => {
        const doctorsCount     = (await ctx.db.query("doctors").collect()).length;
        const patientsCount    = (await ctx.db.query("patients").collect()).length;
        const departmentsCount = (await ctx.db.query("categories").collect()).length;

        return {
            doctors:     doctorsCount,
            departments: departmentsCount,
            patients:    patientsCount,
            experience:  25,
        };
    },
});
